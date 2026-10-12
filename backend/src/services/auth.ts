import type { SupabaseClient } from "@supabase/supabase-js";

export async function requestPasswordReset(
  client: SupabaseClient,
  email: string,
  redirectTo: string,
) {
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), { redirectTo });
  if (error) throw error;
}

export async function changePassword(client: SupabaseClient, password: string) {
  const { data, error: userError } = await client.auth.getUser();
  if (userError) throw userError;
  if (!data.user) throw new Error("Missing recovery session");
  const { error } = await client.auth.updateUser({ password });
  if (error) throw error;
}
