import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";
import { createClient, type User } from "@supabase/supabase-js";
import { analyzeExperience } from "../src/services/analysis";
import {
  decodeExperience,
  diffWorkspace,
  loadAccount,
  saveAccount,
  type ExperienceRow,
} from "../src/repositories/account";
import { emptyData, initialData } from "@folio/shared/mock-data";
import type { ExperienceInput } from "@folio/shared";

const input: ExperienceInput = {
  title: "DB에 저장할 실제 기록",
  type: "프로젝트",
  organization: "학교",
  startDate: "2026-01",
  endDate: "",
  description: "등록 원문",
  role: "Frontend",
  skills: "React",
  problem: "입력 문제",
  action: "화면 구현",
  result: "",
  learning: "",
  github: "",
  fileName: "",
};
test("Supabase SDK restores an empty account and sends atomic changes with the expected actor", async () => {
  const calls: { path: string; authorization: string | null; body: unknown }[] = [];
  let failSave = false;
  const client = createClient("https://unit-test.supabase.co", "test-publishable-key", {
    accessToken: async () => "unit-test-user-token",
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: {
      fetch: async (request, options) => {
        const path = new URL(
          typeof request === "string"
            ? request
            : request instanceof URL
              ? request.href
              : request.url,
        ).pathname;
        const headers = new Headers(options?.headers);
        calls.push({
          path,
          authorization: headers.get("Authorization"),
          body: options?.body ? JSON.parse(String(options.body)) : null,
        });
        if (path.endsWith("/folio_apply_changes"))
          return failSave
            ? new Response(JSON.stringify({ message: "save failed", code: "42501" }), {
                status: 403,
              })
            : new Response(null, { status: 204 });
        return new Response(
          JSON.stringify(
            path.endsWith("/profiles")
              ? { name: "계정", email: "u@example.com", headline: "", about: "" }
              : [],
          ),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    },
  });
  const user = { id: crypto.randomUUID(), email: "u@example.com" } as User;
  const account = await loadAccount(client, user);
  assert.equal(account.session, true);
  assert.deepEqual(account.experiences, []);
  const updated = { ...account, experiences: [analyzeExperience(input)] };
  await saveAccount(client, account, updated, user.id);
  const save = calls.find((call) => call.path.endsWith("/folio_apply_changes"))!;
  assert.equal(save.authorization, "Bearer unit-test-user-token");
  assert.equal((save.body as { changes: { userId: string } }).changes.userId, user.id);
  const callCount = calls.length;
  await saveAccount(client, updated, updated, user.id);
  assert.equal(calls.length, callCount);
  failSave = true;
  await assert.rejects(saveAccount(client, account, updated, user.id));
});
test("workspace diffs save changed records without sending demo fixtures", () => {
  const before = emptyData("사용자", "user@example.com");
  const experience = analyzeExperience(input);
  const after = { ...before, experiences: [experience] };
  assert.deepEqual(diffWorkspace(before, after).experiences, [experience]);
  assert.deepEqual(diffWorkspace(after, after).experiences, []);
  assert.deepEqual(diffWorkspace(after, before).deletedExperiences, [experience.id]);
  assert.throws(() => diffWorkspace(before, initialData()), /데모/);
});
test("database rows restore pending evidence, multiple source links, and months", () => {
  const experience = analyzeExperience(input);
  const row: ExperienceRow = {
    id: experience.id,
    title: experience.title,
    type: experience.type,
    organization: null,
    start_date: "2026-01-01",
    end_date: null,
    description: experience.description,
    role: experience.role,
    skills: experience.skills,
    competencies: [],
    status: "review",
    color: "blue",
    icon: "code",
    created_at: experience.createdAt,
    evidence: [
      {
        id: "source",
        type: "github",
        source: "GitHub",
        content: null,
        source_url: "https://github.com/example/test",
        reference: null,
        status: "unverified",
        supported_skills: [],
      },
    ],
    analysis_claims: [
      {
        section: "action",
        content: "내용",
        status: "user_confirmed",
        evidence_id: "one",
        claim_sources: [{ evidence_id: "one" }, { evidence_id: "two" }],
      },
    ],
  };
  const restored = decodeExperience(row);
  assert.equal(restored.startDate, "2026-01");
  assert.equal(restored.endDate, "");
  assert.equal(restored.evidence[0].status, "needs_review");
  assert.deepEqual(restored.claims[0].evidenceIds, ["one", "two"]);
});

test("PostgreSQL transactions, account isolation, references, and cascade deletion", async (t) => {
  const db = new PGlite();
  try {
    await db.exec(`create role authenticated; create role anon;
      create schema auth; create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated,anon; grant execute on function auth.uid() to authenticated,anon;`);
    const first = await readFile(
      new URL("../supabase/migrations/001_initial_schema.sql", import.meta.url),
      "utf8",
    );
    const second = await readFile(
      new URL("../supabase/migrations/002_account_storage.sql", import.meta.url),
      "utf8",
    );
    await db.exec(first.replace("create extension if not exists pgcrypto;", ""));
    await db.exec(second);
    const userA = crypto.randomUUID(),
      userB = crypto.randomUUID();
    await db.query(
      "insert into auth.users(id,email,raw_user_meta_data) values($1,'a@example.com','{\"name\":\"사용자 A\"}'),($2,'b@example.com','{\"name\":\"사용자 B\"}')",
      [userA, userB],
    );
    let currentUser = "";
    const become = async (id: string) => {
      currentUser = id;
      await db.exec("reset role; set role authenticated;");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
    };
    const apply = async (changes: object) =>
      db.query("select public.folio_apply_changes($1::jsonb)", [
        JSON.stringify({ userId: currentUser, ...changes }),
      ]);
    const blank = {
      experiences: [],
      jobs: [],
      portfolios: [],
      deletedExperiences: [],
      deletedJobs: [],
      deletedPortfolios: [],
    };
    const experienceA = analyzeExperience(input),
      experienceB = analyzeExperience({ ...input, title: "B의 기록" });
    await become(userA);
    await t.test("new account has its own profile and no example records", async () => {
      const rows = await db.query<{ name: string }>("select name from public.profiles");
      assert.deepEqual(rows.rows, [{ name: "사용자 A" }]);
      assert.equal((await db.query("select id from public.experiences")).rows.length, 0);
    });
    await apply({ ...blank, experiences: [experienceA] });
    await t.test("experience claims and exact evidence are saved together", async () => {
      assert.equal((await db.query("select id from public.experiences")).rows.length, 1);
      assert.equal((await db.query("select id from public.analysis_claims")).rows.length, 5);
      assert.equal((await db.query("select evidence_id from public.claim_sources")).rows.length, 3);
      const row = await db.query<{ end_date: string | null }>(
        "select end_date from public.experiences",
      );
      assert.equal(row.rows[0].end_date, null);
    });
    await become(userB);
    await t.test(
      "a session switch cannot save an old user's profile into the new account",
      async () => {
        await assert.rejects(
          apply({
            ...blank,
            userId: userA,
            profile: { name: "잘못된 계정", headline: "", about: "" },
          }),
        );
        assert.equal(
          (await db.query<{ name: string }>("select name from public.profiles")).rows[0].name,
          "사용자 B",
        );
      },
    );
    await t.test("another user cannot read, overwrite, or delete A's experience", async () => {
      assert.equal((await db.query("select id from public.experiences")).rows.length, 0);
      await assert.rejects(
        apply({ ...blank, experiences: [{ ...experienceA, title: "덮어쓰기 시도" }] }),
      );
      await apply({ ...blank, deletedExperiences: [experienceA.id] });
    });
    await apply({ ...blank, experiences: [experienceB] });
    await t.test(
      "a cross-experience citation fails and rolls the whole transaction back",
      async () => {
        const forged = {
          ...experienceB,
          title: "변경 시도",
          claims: experienceB.claims.map((claim) => ({
            ...claim,
            evidenceIds: claim.content !== "사용자 확인 필요" ? [experienceA.evidence[0].id] : [],
          })),
        };
        await assert.rejects(
          apply({
            ...blank,
            profile: { name: "실패할 이름", headline: "", about: "" },
            experiences: [forged],
          }),
        );
        const rows = await db.query<{ title: string }>("select title from public.experiences");
        assert.equal(rows.rows[0].title, "B의 기록");
        assert.equal(
          (await db.query<{ name: string }>("select name from public.profiles")).rows[0].name,
          "사용자 B",
        );
      },
    );
    await t.test("uncollected sources cannot be marked source_verified", async () => {
      await assert.rejects(
        apply({
          ...blank,
          experiences: [
            {
              ...experienceB,
              evidence: experienceB.evidence.map((source) => ({
                ...source,
                status: "source_verified",
              })),
            },
          ],
        }),
      );
    });
    await become(userA);
    await t.test("a fresh DB read restores the saved document and all citation links", async () => {
      const rows = await db.query<{
        document: ExperienceRow;
      }>(`select to_jsonb(e) || jsonb_build_object(
        'evidence',(select coalesce(jsonb_agg(v),'[]') from public.evidence v where v.experience_id=e.id),
        'analysis_claims',(select coalesce(jsonb_agg(to_jsonb(c) || jsonb_build_object('claim_sources',
          (select coalesce(jsonb_agg(jsonb_build_object('evidence_id',s.evidence_id)),'[]') from public.claim_sources s where s.claim_id=c.id))),'[]')
          from public.analysis_claims c where c.experience_id=e.id)) as document from public.experiences e`);
      const restored = decodeExperience(rows.rows[0].document);
      assert.equal(restored.id, experienceA.id);
      assert.equal(
        restored.claims.find((claim) => claim.section === "action")?.content,
        input.action,
      );
      assert.deepEqual(restored.claims.find((claim) => claim.section === "action")?.evidenceIds, [
        experienceA.evidence[0].id,
      ]);
      assert.deepEqual(restored.evidence[0].supportedSkills, ["React"]);
    });
    await t.test("editing and approval persist without losing evidence links", async () => {
      await apply({
        ...blank,
        experiences: [{ ...experienceA, title: "수정한 기록", status: "approved" }],
      });
      const row = await db.query<{ title: string; status: string }>(
        "select title,status from public.experiences",
      );
      assert.deepEqual(row.rows[0], { title: "수정한 기록", status: "approved" });
    });
    const job = {
      id: crypto.randomUUID(),
      company: "회사",
      position: "직무",
      description: "공고",
      skills: [{ name: "React", importance: 5, kind: "required" }],
      responsibilities: ["화면 구현"],
      createdAt: new Date().toISOString(),
    };
    const portfolio = {
      id: crypto.randomUUID(),
      jobId: job.id,
      title: "포트폴리오",
      slug: crypto.randomUUID(),
      visibility: "private",
      experienceIds: [experienceA.id],
      createdAt: new Date().toISOString(),
    };
    await apply({ ...blank, jobs: [job], portfolios: [portfolio] });
    await become(userB);
    await t.test("a portfolio cannot reference another user's job or experience", async () => {
      await assert.rejects(
        apply({
          ...blank,
          portfolios: [{ ...portfolio, id: crypto.randomUUID(), slug: crypto.randomUUID() }],
        }),
      );
    });
    await become(userA);
    await t.test("deletion cascades only through the current user's records", async () => {
      await apply({ ...blank, deletedExperiences: [experienceA.id] });
      assert.equal((await db.query("select id from public.evidence")).rows.length, 0);
      assert.equal((await db.query("select id from public.analysis_claims")).rows.length, 0);
      assert.equal((await db.query("select evidence_id from public.claim_sources")).rows.length, 0);
      await become(userB);
      assert.equal((await db.query("select id from public.experiences")).rows.length, 1);
    });
    await db.exec(
      "reset role; grant usage on schema public to anon; grant select on public.experiences to anon; set role anon;",
    );
    await db.query("select set_config('request.jwt.claim.sub','',false)");
    await t.test("anonymous callers cannot read records or execute account writes", async () => {
      assert.equal((await db.query("select id from public.experiences")).rows.length, 0);
      await assert.rejects(apply(blank));
    });
  } finally {
    await db.close();
  }
});
