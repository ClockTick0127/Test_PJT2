"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowUpRight, Check, ShieldCheck, Sparkles, Layers3 } from "lucide-react";
import { Brand } from "./app-shell";
import { Button } from "./ui/button";
import { Badge } from "./ui/primitives";
import { useStore } from "@/lib/store";
export function Login() {
  const router = useRouter();
  const params = useSearchParams();
  const { data, startDemo, startFresh, update } = useStore();
  const [signup, setSignup] = useState(params.get("mode") === "signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signup && !name.trim()) {
      setError("이름을 입력해 주세요.");
      return;
    }
    setLoading(true);
    setError("");
    if (!signup && data.profile.email === email) {
      update((d) => ({ ...d, session: true }));
      router.push("/dashboard");
      return;
    }
    startFresh(name.trim() || email.split("@")[0], email);
    router.push("/dashboard");
  };
  return (
    <div className="login-page">
      <div className="login-story">
        <Brand />
        <div>
          <Badge tone="blue">YOUR CAREER, CONNECTED</Badge>
          <h1>
            작은 경험들이 모여,
            <br />
            나만의 이야기가 됩니다.
          </h1>
          <p>
            흩어진 경험을 정리하고,
            <br />
            다음 기회에 필요한 나의 강점을 찾아보세요.
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
          <Badge tone="blue">PROTOTYPE</Badge>
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
            <div className="help-note">
              <ShieldCheck size={17} />
              <span>
                데모는 비밀번호 없이 이 브라우저에서 시작해요. 실제 계정 인증은 아직 연결되지
                않았습니다.
              </span>
            </div>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <Button className="full-width" disabled={loading}>
              {loading
                ? "시작하는 중…"
                : signup
                  ? "내 경험으로 시작하기"
                  : "새 워크스페이스 시작하기"}
              <ArrowUpRight size={16} />
            </Button>
          </form>
          {data.profile.email && (
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
            onClick={() => {
              startDemo();
              router.push("/dashboard");
            }}
          >
            <Sparkles size={16} />
            예시 경험으로 데모 둘러보기
          </Button>
          <p className="login-disclaimer">
            새 워크스페이스 또는 데모를 시작하면 현재 브라우저의 기록이 교체됩니다.
            <br />
            자료와 기록은 이 브라우저에만 보관돼요.
          </p>
        </div>
      </div>
    </div>
  );
}
