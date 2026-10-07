"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Layers3,
  BriefcaseBusiness,
  PanelsTopLeft,
  UserRound,
  Settings2,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  Plus,
  ArrowUpRight,
  Check,
  FileText,
  FolderOpen,
  Home,
  PenLine,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { Skeleton } from "./ui/primitives";
const navigation = [
  { href: "/dashboard", label: "작업실 홈", english: "작업실 홈", icon: Home },
  { href: "/experience", label: "경험 문서", english: "경험 문서", icon: FolderOpen },
  { href: "/jobs", label: "채용공고 노트", english: "채용공고 노트", icon: BriefcaseBusiness },
  { href: "/portfolio", label: "포트폴리오", english: "포트폴리오", icon: FileText },
  { href: "/profile", label: "내 프로필", english: "Profile", icon: UserRound },
];
export function Brand({ light = false }: { light?: boolean }) {
  return (
    <Link className={"brand" + (light ? " brand-light" : "")} href="/">
      <span className="brand-mark">
        <span />
        <span />
        <span />
      </span>
      <strong>
        folio<span>.</span>
      </strong>
    </Link>
  );
}
export function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { data, ready, storageError } = useStore();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [notifications, setNotifications] = useState(false);
  useEffect(() => {
    const openSearch = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", openSearch);
    return () => window.removeEventListener("keydown", openSearch);
  }, []);
  const active = navigation.find((n) => path.startsWith(n.href));
  const results = data.experiences.filter((e) =>
    (e.title + " " + e.skills.join(" ")).toLowerCase().includes(query.toLowerCase()),
  );
  const jobs = data.jobs.filter((j) =>
    (j.company + " " + j.position).toLowerCase().includes(query.toLowerCase()),
  );
  if (!ready)
    return (
      <div className="loading-page">
        <Skeleton className="skeleton-title" />
        <Skeleton className="skeleton-card" />
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Brand />
        <div className="workspace-select">
          <span className="workspace-avatar">{data.profile.name.slice(0, 1)}</span>
          <div>
            <strong>{data.profile.name}의 작업실</strong>
            <span>Personal workspace</span>
          </div>
          <ChevronDown size={14} />
        </div>
        <button className="sidebar-search" onClick={() => setSearchOpen(true)}>
          <Search size={16} />
          <span>문서 찾기</span>
          <kbd>Ctrl K</kbd>
        </button>
        <Button asChild className="sidebar-new-document">
          <Link href="/experience/new">
            <Plus size={16} />새 경험 문서
          </Link>
        </Button>
        <div className="nav-label">내 라이브러리</div>
        <nav className="main-nav" aria-label="주요 메뉴">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={path.startsWith(href) ? "nav-item active" : "nav-item"}
              aria-current={path.startsWith(href) ? "page" : undefined}
            >
              <Icon size={19} strokeWidth={1.75} />
              <span>{label}</span>
              {href === "/experience" && <small>{data.experiences.length}</small>}
            </Link>
          ))}
        </nav>
        <div className="sidebar-recent">
          <div className="nav-label">최근 문서</div>
          {data.experiences.slice(0, 3).map((experience) => (
            <Link href={"/experience/" + experience.id} key={experience.id}>
              <FileText size={15} />
              <span>{experience.title}</span>
            </Link>
          ))}
          {!data.experiences.length && <p>새 문서로 첫 기록을 남겨보세요.</p>}
        </div>
        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-symbol">
              <PenLine size={17} />
            </span>
            <strong>기억보다 오래 남는 기록.</strong>
            <p>
              오늘 했던 일을 짧게 적어두세요.
              <br />
              다음 기회의 좋은 시작이 됩니다.
            </p>
            <Link href="/experience/new">
              경험 기록하기
              <Plus size={14} />
            </Link>
          </div>
          <Link href="/settings" className={"nav-item" + (path === "/settings" ? " active" : "")}>
            <Settings2 size={19} />
            <span>설정</span>
          </Link>
          <div className="sidebar-footnote">
            <span className="demo-dot" />
            브라우저 저장 데모<span>v0.1</span>
          </div>
        </div>
      </aside>
      <div className="app-body">
        <header className="app-topbar">
          <div className="breadcrumb">
            <FolderOpen size={14} />
            <span>내 작업실</span>
            <ChevronRight size={12} />
            <strong>{active?.english || "Settings"}</strong>
          </div>
          <div className="topbar-actions">
            <button
              className="global-search"
              onClick={() => setSearchOpen(true)}
              aria-label="경험과 공고 검색"
            >
              <Search size={16} />
              <span>문서 검색</span>
              <kbd>Ctrl K</kbd>
            </button>
            <button
              className="icon-button notification-button"
              aria-label="최근 활동 보기"
              onClick={() => setNotifications(true)}
            >
              <Bell size={19} />
              {data.experiences.some((e) => e.status === "review") && <i />}
            </button>
            <span className="topbar-divider" />
            <Link className="user-menu" href="/profile">
              <span className="user-avatar">{data.profile.name.slice(0, 1)}</span>
              <span>{data.profile.name}</span>
              <ChevronDown size={14} />
            </Link>
          </div>
        </header>
        <nav className="mobile-nav" aria-label="모바일 메뉴">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className={path.startsWith(href) ? "active" : ""}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <main className="main-content">
          {!data.session && (
            <div className="demo-info">
              <Sparkles size={15} />
              브라우저 데모로 둘러보고 있어요.
              <Link href="/login">
                내 경험으로 시작하기
                <ArrowUpRight size={13} />
              </Link>
            </div>
          )}
          {storageError && (
            <div className="error-banner" role="alert">
              {storageError}
            </div>
          )}
          {children}
        </main>
        <footer className="app-footer">
          <span>folio / 나의 경험을 위한 문서 작업실</span>
          <span>
            <ShieldIcon />
            근거가 있는 경험, 믿을 수 있는 포트폴리오
          </span>
        </footer>
      </div>
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent>
          <DialogTitle className="dialog-title">문서 찾기</DialogTitle>
          <DialogDescription className="muted">
            경험 문서와 채용공고 노트에서 필요한 기록을 찾아보세요.
          </DialogDescription>
          <div className="search-field">
            <Search size={18} />
            <input
              autoFocus
              placeholder="경험이나 공고를 검색하세요"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div className="search-results">
            {results.slice(0, 5).map((e) => (
              <button
                key={e.id}
                onClick={() => {
                  setSearchOpen(false);
                  router.push("/experience/" + e.id);
                }}
              >
                <Layers3 size={17} />
                <span>
                  {e.title}
                  <small>{e.role}</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
            {jobs.slice(0, 3).map((j) => (
              <button
                key={j.id}
                onClick={() => {
                  setSearchOpen(false);
                  router.push("/jobs/" + j.id);
                }}
              >
                <BriefcaseBusiness size={17} />
                <span>
                  {j.company}
                  <small>{j.position}</small>
                </span>
                <ArrowUpRight size={16} />
              </button>
            ))}
            {!results.length && !jobs.length && (
              <p className="muted">일치하는 경험이나 공고가 없습니다.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={notifications} onOpenChange={setNotifications}>
        <DialogContent>
          <DialogTitle className="dialog-title">최근 활동</DialogTitle>
          <DialogDescription className="muted">
            라이브러리와 포트폴리오의 현재 상태입니다.
          </DialogDescription>
          <div className="activity-list">
            <p>
              <Check size={18} />
              {data.experiences.filter((e) => e.status === "approved").length}개의 경험이 분석과
              확인을 마쳤습니다.
            </p>
            <p>
              <Layers3 size={18} />
              {data.experiences.filter((e) => e.status === "review").length}개의 경험이 검토를
              기다리고 있습니다.
            </p>
            <p>
              <PanelsTopLeft size={18} />
              {data.portfolios.length}개의 포트폴리오 초안이 저장되어 있습니다.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              setNotifications(false);
              router.push("/experience");
            }}
          >
            라이브러리 살펴보기
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
function ShieldIcon() {
  return <span className="footer-shield">◇</span>;
}
