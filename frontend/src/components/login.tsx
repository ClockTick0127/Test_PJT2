"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Check, ShieldCheck, Sparkles, Layers3 } from "lucide-react";
import { Brand } from "./app-shell";
import { Button } from "./ui/button";
import { Badge } from "./ui/primitives";
import { useStore } from "@/lib/store";
import { authError } from "@/lib/supabase";
export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, startDemo, signIn, signUp, mode, ready, configured, accountLoaded, storageError } =
    useStore();
  const [signup, setSignup] = useState(params.get("mode") === "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (ready && mode === "account" && accountLoaded) router.replace("/dashboard");
  }, [ready, mode, accountLoaded, router]);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (signup && !name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      if (signup) {
        const result = await signUp(name.trim(), email.trim(), password);
        if (result === "verify") {
          setPassword("");
          setSignup(false);
          setMessage("인증 메일을 보냈습니다. 이메일의 링크를 누른 뒤 로그인해 주세요.");
          return;
        }
      } else await signIn(email.trim(), password);
      setPassword("");
      router.push("/dashboard");
    } catch (cause) {
      setError(authError(cause));
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="login-page">
      <div className="login-story">
        <Brand />
        <div>
          <Badge tone="blue">YOUR PERSONAL WORKSPACE</Badge>
          <h1>
            나를 기록하는,
            <br />
            작은 문서 작업실.
          </h1>
          <p>
            경험을 기록하고, 필요한 순간에 찾아보세요.
            <br />내 이야기를 쓰는 일은 작은 메모에서 시작됩니다.
          </p>
          <div className="login-story-card">
            <span className="project-icon tone-blue">
              <Layers3 size={25} />
            </span>
            <div>
              <strong>내 경험의 모든 가능성</strong>
              <p>Experience → Evidence → Opportunity</p>
            </div>
            <Sparkles size={20} />
          </div>
          <ul>
            <li>
              <Check size={17} />
              한곳에 쌓이는 나의 경험
            </li>
            <li>
              <Check size={17} />
              근거로 연결되는 나의 강점
            </li>
            <li>
              <Check size={17} />
              기업에 맞춘 나만의 포트폴리오
            </li>
          </ul>
        </div>
        <small>경험이 기회가 되는 곳, folio.</small>
      </div>
      <div className="login-form-side">
        <div className="login-mobile-brand">
          <Brand />
        </div>
        <div className="login-form">
          <Badge tone="blue">{configured ? "ACCOUNT WORKSPACE" : "CONNECTION REQUIRED"}</Badge>
          <h2>{signup ? "첫 이야기를 시작해볼까요?" : "다시 만나 반가워요."}</h2>
          <p>
            {signup ? "나만의 커리어 공간을 만들어보세요." : "나의 경험과 다음 기회를 연결하세요."}
          </p>
          <div className="login-tabs">
            <button
              className={!signup ? "active" : ""}
              onClick={() => {
                setSignup(false);
                setError("");
              }}
            >
              로그인
            </button>
            <button
              className={signup ? "active" : ""}
              onClick={() => {
                setSignup(true);
                setError("");
              }}
            >
              회원가입
            </button>
          </div>
          <form onSubmit={submit}>
            {!configured && (
              <div className="help-note" role="status">
                아직 계정 연결이 설정되지 않았습니다. Supabase 연결 후 가입·로그인을 이용할 수
                있으며, 아래 데모는 바로 사용할 수 있어요.
              </div>
            )}
            {signup && (
              <label>
                이름
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="어떻게 불러드릴까요?"
                  required
                  autoComplete="name"
                  maxLength={40}
                />
              </label>
            )}
            <label>
              이메일
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
              />
            </label>
            <label>
              비밀번호
              <input
                type="password"
                required
                minLength={signup ? 8 : undefined}
                maxLength={128}
                autoComplete={signup ? "new-password" : "current-password"}
                placeholder={signup ? "8자 이상 입력하세요" : "비밀번호를 입력하세요"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>
            <div className="help-note">
              <ShieldCheck size={17} />
              <span>
                {signup
                  ? "새 계정은 빈 문서함으로 시작합니다. 이메일 인증이 필요한 경우 인증 링크를 보내드립니다."
                  : "이메일과 비밀번호로 로그인하면 저장한 기록을 다시 불러옵니다."}
              </span>
            </div>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            {message && (
              <p className="help-note" role="status">
                {message}
              </p>
            )}
            <Button className="full-width" disabled={loading || !configured || !ready}>
              {loading ? "시작하는 중…" : signup ? "회원가입" : "로그인"}
              <ArrowUpRight size={16} />
            </Button>
          </form>
          {mode !== "guest" && (
            <Button
              variant="outline"
              className="full-width continue-button"
              onClick={() => router.push("/dashboard")}
            >
              기존 {data.profile.name}님의 기록 이어보기
            </Button>
          )}
          <div className="login-or">
            <span />
            또는
            <span />
          </div>
          <Button
            variant="outline"
            className="full-width"
            disabled={loading || !ready}
            onClick={async () => {
              setLoading(true);
              try {
                if (await startDemo()) router.push("/dashboard");
              } finally {
                setLoading(false);
              }
            }}
          >
            <Sparkles size={16} />
            예시 경험으로 데모 둘러보기
          </Button>
          <p className="login-disclaimer">
            데모 문서함은 실제 계정과 분리되어 브라우저에 저장됩니다.
            <br />
            계정의 기록은 로그인한 사용자만 조회할 수 있어요.
          </p>
          {storageError && (
            <p className="form-error" role="alert">
              {storageError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
