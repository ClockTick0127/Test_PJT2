import test from "node:test";
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";
import { changePassword, requestPasswordReset } from "../src/services/auth";

test("password recovery sends the email and exact redirect URL and reports delivery failures", async () => {
  let fail = false;
  const calls: { url: URL; body: unknown }[] = [];
  const client = createClient("https://unit-test.supabase.co", "test-publishable-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (request, options) => {
        calls.push({ url: new URL(String(request)), body: JSON.parse(String(options?.body)) });
        return new Response(
          JSON.stringify(
            fail
              ? { msg: "Email rate limit exceeded", error_code: "over_email_send_rate_limit" }
              : {},
          ),
          { status: fail ? 429 : 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  });
  const redirect = "http://127.0.0.1:3000/reset-password";
  await requestPasswordReset(client, " user@example.com ", redirect);
  assert.equal(calls[0].url.pathname, "/auth/v1/recover");
  assert.equal(calls[0].url.searchParams.get("redirect_to"), redirect);
  assert.equal((calls[0].body as { email: string }).email, "user@example.com");
  fail = true;
  await assert.rejects(requestPasswordReset(client, "user@example.com", redirect));
});

test("password changes require a verified session and do not send a new password without one", async () => {
  let requests = 0;
  const client = createClient("https://unit-test.supabase.co", "test-publishable-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async () => {
        requests++;
        return new Response("{}", { status: 200 });
      },
    },
  });
  await assert.rejects(changePassword(client, "Temporary-test-password"));
  assert.equal(requests, 0);
});

test("authenticated password changes validate the user and propagate update failures", async () => {
  const user = {
    id: crypto.randomUUID(),
    aud: "authenticated",
    email: "test@example.com",
    app_metadata: {},
    user_metadata: {},
    created_at: new Date().toISOString(),
  };
  let failUpdate = false;
  const calls: { method: string; body: unknown }[] = [];
  const client = createClient("https://unit-test.supabase.co", "test-publishable-key", {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (_request, options) => {
        const method = options?.method || "GET";
        calls.push({ method, body: options?.body ? JSON.parse(String(options.body)) : null });
        return new Response(
          JSON.stringify(method === "PUT" && failUpdate ? { msg: "Password rejected" } : user),
          {
            status: method === "PUT" && failUpdate ? 422 : 200,
            headers: { "content-type": "application/json" },
          },
        );
      },
    },
  });
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString("base64url");
  const token =
    part({ alg: "HS256", typ: "JWT" }) +
    "." +
    part({ sub: user.id, exp: Math.floor(Date.now() / 1000) + 3600 }) +
    "." +
    Buffer.from("unit-test-signature").toString("base64url");
  const session = await client.auth.setSession({
    access_token: token,
    refresh_token: "test-refresh-token",
  });
  assert.equal(session.error, null);
  calls.length = 0;
  await changePassword(client, "New-test-password");
  assert.deepEqual(
    calls.map((call) => call.method),
    ["GET", "PUT"],
  );
  assert.equal((calls[1].body as { password: string }).password, "New-test-password");
  failUpdate = true;
  await assert.rejects(changePassword(client, "Another-test-password"));
});
