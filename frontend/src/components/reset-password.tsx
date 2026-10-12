"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { changePassword } from "@folio/backend/auth";
import { authError, getSupabase } from "@/lib/supabase";
import { useStore } from "@/lib/store";
import { Brand } from "./app-shell";
import { Button } from "./ui/button";

export function ResetPassword() {
  const router = useRouter();
  const { logout } = useStore();
  const [checking, setChecking] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [complete, setComplete] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      try {
        if (new URLSearchParams(window.location.hash.slice(1)).has("error"))
          throw new Error("Expired recovery link");
        const client = getSupabase();
        if (!client) throw new Error("Not configured");
        const { data, error: cause } = await client.auth.getUser();
        if (cause || !data.user) throw cause || new Error("Missing recovery session");
        if (alive) setAuthorized(true);
      } catch {
        if (alive)
          setError(
            "재설정 링크가 만료되었거나 유효하지 않습니다. 로그인 화면에서 새 링크를 요청해 주세요.",
          );
      } finally {
        if (alive) setChecking(false);
      }
    };
    void check();
    return () => {
      alive = false;
    };
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (password.length < 8 || password.length > 128) {
      setError("비밀번호는 8자 이상 128자 이하로 입력해 주세요.");
      return;
    }
    if (password !== confirmation) {
      setError("두 비밀번호가 일치하지 않습니다.");
      return;
    }
    setSaving(true);
    try {
      const client = getSupabase();
      if (!client) throw new Error("Not configured");
      await changePassword(client, password);
      setPassword("");
      setConfirmation("");
      setComplete(true);
      if (!(await logout()))
        setError(
          "비밀번호는 변경되었습니다. 로그인 화면으로 돌아가기 전에 로그아웃을 다시 시도해 주세요.",
        );
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="password-reset-page">
      <div className="login-form panel">
        <Brand />
        <h1>{complete ? "비밀번호를 변경했습니다." : "새 비밀번호 설정"}</h1>
        {checking ? (
          <p role="status">재설정 링크를 확인하고 있습니다.</p>
        ) : complete ? (
          <>
            <p role="status">새 비밀번호로 다시 로그인해 주세요.</p>
            <Button
              className="full-width"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                if (await logout()) router.replace("/login");
                else setError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
                setSaving(false);
              }}
            >
              로그인 화면으로 이동
            </Button>
          </>
        ) : authorized ? (
          <form onSubmit={submit}>
            <label>
              새 비밀번호
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={saving}
              />
            </label>
            <label>
              새 비밀번호 확인
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                maxLength={128}
                required
                value={confirmation}
                onChange={(event) => setConfirmation(event.target.value)}
                disabled={saving}
              />
            </label>
            <p className="muted">8자 이상 입력해 주세요.</p>
            <Button className="full-width" disabled={saving}>
              {saving ? "변경 중…" : "비밀번호 변경"}
            </Button>
          </form>
        ) : (
          <Button asChild variant="outline" className="full-width">
            <Link href="/login">새 재설정 링크 요청하기</Link>
          </Button>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
