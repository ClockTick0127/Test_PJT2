"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  UserRound,
  Check,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  LogOut,
  Database,
  Layers3,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Badge } from "./ui/primitives";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { PageHeading, HelpNote } from "./shared";
import { emptyData } from "@folio/shared/mock-data";
export function ProfileScreen() {
  const { data, update, toast, mode, saving } = useStore();
  const [profile, setProfile] = useState(data.profile);
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await update((d) => ({ ...d, profile })))) return;
    toast("프로필을 저장했습니다. 포트폴리오에도 반영됩니다.");
  };
  return (
    <>
      <PageHeading
        eyebrow="MY PROFILE"
        title="나를 소개하는 이야기"
        description="내 프로필을 정리하면, 모든 포트폴리오에 함께 담겨요."
      />
      <div className="profile-columns">
        <form className="panel profile-form" onSubmit={save}>
          <div className="profile-avatar-row">
            <div className="large-avatar">{profile.name.slice(0, 1)}</div>
            <div>
              <h2>{profile.name}</h2>
              <span>{profile.email}</span>
            </div>
            <Badge tone="blue">My Profile</Badge>
          </div>
          <div className="form-grid">
            <label>
              이름
              <input
                required
                maxLength={40}
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              />
            </label>
            <label>
              이메일
              <input
                type="email"
                required
                value={profile.email}
                readOnly={mode === "account"}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              />
            </label>
          </div>
          <label>
            나를 소개하는 한 문장
            <input
              maxLength={150}
              placeholder="예: 사용자의 문제를 해결하는 프론트엔드 개발자"
              value={profile.headline}
              onChange={(e) => setProfile({ ...profile, headline: e.target.value })}
            />
          </label>
          <label>
            About Me
            <textarea
              rows={6}
              maxLength={3000}
              placeholder="관심 분야, 일하는 방식, 경험에서 발견한 나의 강점을 적어주세요."
              value={profile.about}
              onChange={(e) => setProfile({ ...profile, about: e.target.value })}
            />
            <small>이 내용은 포트폴리오의 자기소개에 표시됩니다.</small>
          </label>
          <div className="form-footer">
            <span>
              <ShieldCheck size={15} />
              프로필도 직접 확인한 내용으로.
            </span>
            <Button disabled={saving}>
              <Check size={16} />
              프로필 저장
            </Button>
          </div>
        </form>
        <aside>
          <div className="aside-help">
            <UserRound size={25} />
            <h3>내 경험을 관통하는 강점</h3>
            <p>
              자기소개는 거창하지 않아도 괜찮아요. 어떤 문제에 관심이 있고, 어떻게 해결하는 사람인지
              담아보세요.
            </p>
          </div>
          <div className="panel detail-aside">
            <h3>나의 커리어 기록</h3>
            <div className="profile-counts">
              <span>
                경험<strong>{data.experiences.length}</strong>
              </span>
              <span>
                포트폴리오<strong>{data.portfolios.length}</strong>
              </span>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
export function SettingsScreen() {
  const router = useRouter();
  const { update, startDemo, toast, mode, logout, saving } = useStore();
  const [confirm, setConfirm] = useState<"empty" | "demo" | null>(null);
  const [busy, setBusy] = useState(false);
  const reset = async () => {
    setBusy(true);
    try {
      const success =
        confirm === "demo"
          ? await startDemo(true)
          : mode === "demo" &&
            (await update((data) => ({ ...emptyData(), profile: data.profile, session: true })));
      if (!success) return;
      setConfirm(null);
      toast("데모 문서함을 초기화했습니다.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <PageHeading
        eyebrow="SETTINGS"
        title="워크스페이스 설정"
        description="계정의 기록과 데모 문서함을 관리하세요."
      />
      <div className="settings-content">
        <section className="panel settings-panel">
          <h2>
            <Database size={20} />
            데이터 저장
          </h2>
          <div className="settings-row">
            <div>
              <strong>
                {mode === "account" ? "계정의 DB에 저장" : "데모는 이 브라우저에 저장"}
              </strong>
              <p>
                {mode === "account"
                  ? "같은 계정으로 로그인하면 다른 기기에서도 기록을 불러올 수 있습니다."
                  : "예시 문서함의 변경 내용은 실제 계정과 분리됩니다."}
              </p>
            </div>
            <Badge tone="blue">{mode === "account" ? "Supabase 연결" : "로컬 데모"}</Badge>
          </div>
          <HelpNote>
            {mode === "account"
              ? "로그인한 사용자만 기록을 조회·수정할 수 있습니다. 데모 기록은 계정에 자동으로 업로드하지 않습니다."
              : "데모 기록은 브라우저 데이터를 삭제하면 사라집니다. 실제 계정 기록에는 영향을 주지 않습니다."}
          </HelpNote>
        </section>
        <section className="panel settings-panel">
          <h2>
            <ShieldCheck size={20} />
            분석과 근거
          </h2>
          <div className="settings-row">
            <div>
              <strong>근거 기반 분석 원칙</strong>
              <p>없는 경험과 숫자는 생성하지 않고 확인되지 않은 내용은 표시합니다.</p>
            </div>
            <Badge tone="green">항상 적용</Badge>
          </div>
          <div className="settings-row">
            <div>
              <strong>분석 방식</strong>
              <p>경험 입력의 구조화와 요구 역량 가중치 비교를 제공합니다.</p>
            </div>
            <Badge>AI API 미연결</Badge>
          </div>
        </section>
        <section className="panel settings-panel">
          <h2>
            <Layers3 size={20} />
            워크스페이스 관리
          </h2>
          <div className="settings-row">
            <div>
              <strong>예시 문서함으로 이동</strong>
              <p>로그아웃 후 별도의 예시 문서함으로 이동합니다. 계정 기록은 유지됩니다.</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={busy || saving}
              onClick={() => setConfirm("demo")}
            >
              <Sparkles size={15} />
              데모로 시작
            </Button>
          </div>
          <div className="settings-row">
            <div>
              <strong>데모 기록 초기화</strong>
              <p>
                {mode === "demo"
                  ? "이 브라우저의 데모 기록만 삭제합니다."
                  : "계정의 경험은 각 문서 상세에서 개별 삭제할 수 있습니다."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={mode !== "demo" || busy || saving}
              onClick={() => setConfirm("empty")}
            >
              <RotateCcw size={15} />
              기록 초기화
            </Button>
          </div>
          <div className="settings-row">
            <div>
              <strong>{mode === "account" ? "로그아웃" : "데모 나가기"}</strong>
              <p>현재 기기에서 나갑니다. 저장된 기록은 유지됩니다.</p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              disabled={busy || saving}
              onClick={async () => {
                setBusy(true);
                try {
                  if (await logout()) router.push("/login");
                } finally {
                  setBusy(false);
                }
              }}
            >
              <LogOut size={15} />
              나가기
            </Button>
          </div>
        </section>
      </div>
      <Dialog open={!!confirm} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        <DialogContent>
          <DialogTitle className="dialog-title">데모 문서함을 초기화할까요?</DialogTitle>
          <DialogDescription className="muted">
            {confirm === "demo"
              ? "로그아웃 후 예시 문서함을 초기화합니다."
              : "이 브라우저의 데모 기록을 삭제합니다."}{" "}
            실제 계정에 저장된 기록에는 영향을 주지 않습니다.
          </DialogDescription>
          <div className="dialog-actions">
            <Button variant="outline" disabled={busy} onClick={() => setConfirm(null)}>
              취소
            </Button>
            <Button variant="destructive" disabled={busy} onClick={reset}>
              {busy ? "처리 중…" : "초기화"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
