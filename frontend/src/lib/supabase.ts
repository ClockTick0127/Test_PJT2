import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export const supabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
);
let client: SupabaseClient | undefined;
export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured || typeof window === "undefined") return null;
  client ??= createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } },
  );
  return client;
}
export function authError(error: unknown): string {
  const message =
    error instanceof Error ? error.message : String((error as { message?: string })?.message || "");
  if (/invalid login credentials/i.test(message))
    return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (/email not confirmed/i.test(message)) return "이메일 인증을 완료한 뒤 로그인해 주세요.";
  if (/rate limit|too many|security purposes/i.test(message))
    return "요청이 많습니다. 잠시 후 다시 시도해 주세요.";
  if (/password|weak/i.test(message))
    return "비밀번호가 보안 기준에 맞지 않습니다. 더 긴 비밀번호를 사용해 주세요.";
  if (/already registered/i.test(message)) return "이미 가입한 이메일입니다. 로그인해 주세요.";
  return "요청을 완료하지 못했습니다. 연결 상태와 Supabase 설정을 확인하고 다시 시도해 주세요.";
}
