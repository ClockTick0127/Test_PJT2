"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ArrowLeft,
  FileText,
  GitBranch,
  PenLine,
  Upload,
  Sparkles,
  ShieldCheck,
  Check,
  ArrowUpRight,
  Layers3,
  CircleAlert,
  Clock3,
  Building2,
  CalendarDays,
  UserRound,
  CheckCheck,
  Pencil,
  X,
  ChevronDown,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { analyzeExperience, completeness } from "@/lib/mock-analysis";
import { experienceTypes, sections, type ExperienceInput, type Claim } from "@folio/shared";
import { period } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge, Empty, Progress, Skeleton } from "./ui/primitives";
import {
  PageHeading,
  ExperienceCard,
  AddExperienceCard,
  ProjectIcon,
  EvidenceList,
  HelpNote,
  VerificationNote,
  NothingFound,
} from "./shared";
export function ExperienceLibrary() {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [status, setStatus] = useState("all");
  const [skill, setSkill] = useState("all");
  const [order, setOrder] = useState("recent");
  const [view, setView] = useState("grid");
  const [advanced, setAdvanced] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("0");
  const [competency, setCompetency] = useState("all");
  const allSkills = [...new Set(data.experiences.flatMap((e) => e.skills))].sort();
  const allCompetencies = [...new Set(data.experiences.flatMap((e) => e.competencies))].sort();
  const items = data.experiences
    .filter(
      (e) =>
        (e.title + " " + e.role + " " + e.skills.join(" "))
          .toLowerCase()
          .includes(query.toLowerCase()) &&
        (type === "all" || e.type === type) &&
        (status === "all" || e.status === status) &&
        (skill === "all" || e.skills.includes(skill)) &&
        (!from || e.startDate >= from) &&
        (!to || (e.endDate || "9999") <= to) &&
        completeness(e) >= Number(min) &&
        (competency === "all" || e.competencies.includes(competency)),
    )
    .sort((a, b) =>
      order === "complete"
        ? completeness(b) - completeness(a)
        : order === "title"
          ? a.title.localeCompare(b.title, "ko")
          : b.createdAt.localeCompare(a.createdAt),
    );
  const reset = () => {
    setQuery("");
    setType("all");
    setStatus("all");
    setSkill("all");
    setFrom("");
    setTo("");
    setMin("0");
    setCompetency("all");
  };
  return (
    <>
      <PageHeading
        eyebrow="EXPERIENCE LIBRARY"
        title="나의 경험 라이브러리"
        description="모든 경험에는 가능성이 있어요. 나만의 기록을 차곡차곡 쌓아보세요."
        action={
          <Button asChild>
            <Link href="/experience/new">
              <Plus size={17} />
              경험 추가
            </Link>
          </Button>
        }
      />
      <div className="library-summary">
        <div>
          <Layers3 size={19} />
          <span>
            전체 경험 <strong>{data.experiences.length}</strong>
          </span>
        </div>
        <span className="summary-divider" />
        <div>
          <ShieldCheck size={18} />
          <span>
            연결된 근거{" "}
            <strong>{data.experiences.reduce((sum, e) => sum + e.evidence.length, 0)}</strong>
          </span>
        </div>
        <div className="summary-right">
          <span className="tiny-dot" />
          {data.experiences.filter((e) => e.status === "approved").length}개 분석 완료
        </div>
      </div>
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            aria-label="경험 검색"
            placeholder="경험 제목, 역할, 기술 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="검색 지우기">
              <X size={15} />
            </button>
          )}
        </div>
        <select aria-label="경험 유형" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">전체 유형</option>
          {experienceTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
        <select aria-label="사용 기술" value={skill} onChange={(e) => setSkill(e.target.value)}>
          <option value="all">전체 기술</option>
          {allSkills.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <select aria-label="분석 상태" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">전체 상태</option>
          <option value="approved">분석 완료</option>
          <option value="review">검토 필요</option>
        </select>
        <Button
          variant="outline"
          size="icon"
          aria-label="추가 필터"
          aria-expanded={advanced}
          onClick={() => setAdvanced(!advanced)}
        >
          <SlidersHorizontal size={17} />
        </Button>
      </div>
      {advanced && (
        <div className="advanced-filters">
          <label>
            시작 기간
            <input type="month" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            종료 기간
            <input type="month" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <label>
            최소 완성도
            <select value={min} onChange={(e) => setMin(e.target.value)}>
              <option value="0">전체</option>
              <option value="50">50% 이상</option>
              <option value="80">80% 이상</option>
              <option value="100">100%</option>
            </select>
          </label>
          <label>
            핵심 역량
            <select value={competency} onChange={(e) => setCompetency(e.target.value)}>
              <option value="all">전체 역량</option>
              {allCompetencies.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <Button variant="ghost" size="sm" onClick={reset}>
            필터 초기화
          </Button>
        </div>
      )}
      <div className="library-result-bar">
        <span>
          총 <strong>{items.length}</strong>개의 경험
        </span>
        <div>
          <select aria-label="정렬" value={order} onChange={(e) => setOrder(e.target.value)}>
            <option value="recent">최근 등록순</option>
            <option value="complete">완성도순</option>
            <option value="title">이름순</option>
          </select>
          <div className="view-toggle">
            <button
              aria-label="카드 보기"
              aria-pressed={view === "grid"}
              className={view === "grid" ? "active" : ""}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              aria-label="리스트 보기"
              aria-pressed={view === "list"}
              className={view === "list" ? "active" : ""}
              onClick={() => setView("list")}
            >
              <List size={17} />
            </button>
          </div>
        </div>
      </div>
      {!data.experiences.length ? (
        <Empty
          icon={<Layers3 size={30} />}
          title="아직 등록된 경험이 없습니다."
          description="첫 번째 경험을 등록하고, 나의 강점을 정리해보세요."
        >
          <Button asChild>
            <Link href="/experience/new">
              <Plus size={16} />첫 경험 등록하기
            </Link>
          </Button>
        </Empty>
      ) : !items.length ? (
        <>
          <NothingFound />
          <Button variant="outline" onClick={reset}>
            필터 초기화
          </Button>
        </>
      ) : view === "grid" ? (
        <div className="experience-grid">
          {items.map((e) => (
            <ExperienceCard key={e.id} experience={e} />
          ))}
          <AddExperienceCard />
        </div>
      ) : (
        <div className="experience-table">
          {items.map((e) => (
            <Link key={e.id} href={"/experience/" + e.id} className="experience-table-row">
              <ProjectIcon experience={e} small />
              <div>
                <strong>{e.title}</strong>
                <small>
                  {e.role} · {period(e.startDate, e.endDate)}
                </small>
              </div>
              <div className="table-tags">
                {e.skills.slice(0, 2).map((s) => (
                  <Badge key={s}>{s}</Badge>
                ))}
              </div>
              <span>{e.evidence.length}개 근거</span>
              <strong className="table-score">{completeness(e)}%</strong>
              <ArrowUpRight size={17} />
            </Link>
          ))}
        </div>
      )}
      <VerificationNote />
    </>
  );
}
const defaultInput: ExperienceInput = {
  title: "",
  type: "프로젝트",
  organization: "",
  startDate: "",
  endDate: "",
  description: "",
  role: "",
  skills: "",
  problem: "",
  action: "",
  result: "",
  learning: "",
  github: "",
  fileName: "",
};
export function NewExperience() {
  const { update, toast } = useStore();
  const router = useRouter();
  const [input, setInput] = useState<ExperienceInput>(defaultInput);
  const [method, setMethod] = useState("manual");
  const [more, setMore] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const field = (key: keyof ExperienceInput, value: string) =>
    setInput((v) => ({ ...v, [key]: value }));
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!input.title.trim() || !input.description.trim() || !input.role.trim()) {
      setError("제목, 경험 설명, 내 역할을 입력해 주세요.");
      return;
    }
    if (input.endDate && input.startDate && input.endDate < input.startDate) {
      setError("종료일은 시작일보다 빠를 수 없습니다.");
      return;
    }
    if (input.github && !/^https:\/\/github\.com\/[\w.-]+\/[\w.-]+(?:\/.*)?$/.test(input.github)) {
      setError("https://github.com/사용자/저장소 형태의 URL을 입력해 주세요.");
      return;
    }
    if (method === "pdf" && !input.fileName) {
      setError("PDF 파일을 선택해 주세요.");
      return;
    }
    if (method === "github" && !input.github) {
      setError("GitHub 저장소 URL을 입력해 주세요.");
      return;
    }
    setSubmitting(true);
    const experience = analyzeExperience(input);
    update((d) => ({ ...d, experiences: [experience, ...d.experiences] }));
    toast("경험이 초안으로 저장되었습니다.");
    router.push("/experience/" + experience.id + "/analyze");
  };
  return (
    <>
      <Link className="back-link" href="/experience">
        <ArrowLeft size={16} />
        경험 라이브러리
      </Link>
      <PageHeading
        eyebrow="NEW EXPERIENCE"
        title="어떤 경험을 남기고 싶나요?"
        description="완벽하게 적지 않아도 괜찮아요. 중요한 내용을 짧게 남겨주세요."
      />
      <div className="form-with-aside">
        <form onSubmit={submit} className="panel experience-form">
          <div className="form-section-title">
            <span>01</span>
            <div>
              <h2>경험의 시작점을 선택하세요</h2>
              <p>먼저 기록을 모으고, 함께 내용을 확인해요.</p>
            </div>
          </div>
          <div className="input-methods" role="group" aria-label="입력 방법">
            {[
              { id: "manual", icon: PenLine, label: "직접 입력", note: "짧은 메모로 시작" },
              { id: "pdf", icon: FileText, label: "PDF 자료", note: "파일 첨부 데모" },
              { id: "github", icon: GitBranch, label: "GitHub URL", note: "저장소 연결 준비" },
            ].map(({ id, icon: Icon, label, note }) => (
              <button
                type="button"
                aria-pressed={method === id}
                key={id}
                className={method === id ? "active" : ""}
                onClick={() => setMethod(id)}
              >
                <Icon size={22} />
                <strong>{label}</strong>
                <span>{note}</span>
                {method === id && <Check size={13} className="method-check" />}
              </button>
            ))}
          </div>
          {method === "pdf" && (
            <>
              <label className="upload-zone">
                <Upload size={28} />
                <strong>{input.fileName || "프로젝트 자료를 선택하세요"}</strong>
                <span>PDF · 최대 10MB · 파일 이름만 저장되는 데모</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (!f.name.toLowerCase().endsWith(".pdf") || f.size > 10 * 1024 * 1024) {
                        setError("10MB 이하의 PDF 파일을 선택해 주세요.");
                        e.target.value = "";
                        field("fileName", "");
                      } else {
                        field("fileName", f.name);
                        setError("");
                      }
                    }
                  }}
                />
              </label>
              <HelpNote>
                이 프로토타입은 PDF 본문을 읽지 않습니다. 자료의 핵심 내용을 아래에 적으면 그 입력을
                기준으로 정리합니다.
              </HelpNote>
            </>
          )}
          {method === "github" && (
            <label>
              GitHub 저장소 URL
              <input
                type="url"
                placeholder="https://github.com/username/project"
                value={input.github}
                onChange={(e) => field("github", e.target.value)}
              />
              <small>
                저장소 내용은 아직 수집하지 않습니다. URL은 확인이 필요한 참고 자료로 보관됩니다.
              </small>
            </label>
          )}
          <div className="form-divider" />
          <div className="form-section-title">
            <span>02</span>
            <div>
              <h2>어떤 경험인가요?</h2>
              <p>경험을 설명할 수 있는 기본 정보를 적어주세요.</p>
            </div>
          </div>
          <label>
            경험 제목 <i>*</i>
            <input
              required
              maxLength={100}
              placeholder="예: 당뇨 환자를 위한 식단 추천 서비스"
              value={input.title}
              onChange={(e) => field("title", e.target.value)}
            />
          </label>
          <div className="form-grid">
            <label>
              경험 유형
              <select value={input.type} onChange={(e) => field("type", e.target.value)}>
                {experienceTypes.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </label>
            <label>
              소속
              <input
                maxLength={100}
                placeholder="팀, 학교, 회사 이름"
                value={input.organization}
                onChange={(e) => field("organization", e.target.value)}
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              시작 기간
              <input
                type="month"
                value={input.startDate}
                onChange={(e) => field("startDate", e.target.value)}
              />
            </label>
            <label>
              종료 기간
              <input
                type="month"
                min={input.startDate}
                value={input.endDate}
                onChange={(e) => field("endDate", e.target.value)}
              />
              <small>진행 중이라면 비워두세요.</small>
            </label>
          </div>
          <label>
            경험 설명 <i>*</i>
            <textarea
              required
              rows={4}
              maxLength={5000}
              placeholder="무엇을 만들거나 수행했나요? 어떤 경험이었는지 자유롭게 적어주세요."
              value={input.description}
              onChange={(e) => field("description", e.target.value)}
            />
          </label>
          <label>
            내 역할 <i>*</i>
            <input
              required
              maxLength={500}
              placeholder="예: Frontend 개발 및 추천 결과 UI 설계"
              value={input.role}
              onChange={(e) => field("role", e.target.value)}
            />
          </label>
          <label>
            사용 기술
            <input
              maxLength={500}
              placeholder="예: React, JavaScript, FastAPI (쉼표로 구분)"
              value={input.skills}
              onChange={(e) => field("skills", e.target.value)}
            />
          </label>
          <button
            type="button"
            className="expand-fields"
            onClick={() => setMore(!more)}
            aria-expanded={more}
          >
            <Plus size={15} />
            {more ? "추가 내용 접기" : "문제, 행동, 결과도 남기고 싶어요"}
            <ChevronDown size={15} />
          </button>
          {more && (
            <div className="extra-fields">
              {sections
                .filter((s) => s.key !== "role")
                .map(({ key, label, question }) => (
                  <label key={key}>
                    {label}
                    <textarea
                      rows={3}
                      maxLength={3000}
                      placeholder={question + " (선택)"}
                      value={input[key]}
                      onChange={(e) => field(key, e.target.value)}
                    />
                  </label>
                ))}
            </div>
          )}
          {error && (
            <div className="form-error" role="alert">
              <CircleAlert size={16} />
              {error}
            </div>
          )}
          <div className="form-footer">
            <span>
              <ShieldCheck size={15} />
              내가 입력한 내용만 정리해요.
            </span>
            <Button disabled={submitting}>
              <Sparkles size={17} />
              {submitting ? "초안 저장 중…" : "경험 분석하기"}
            </Button>
          </div>
        </form>
        <aside className="form-aside">
          <div className="aside-help">
            <span className="tip-symbol">
              <Sparkles size={23} />
            </span>
            <h3>작은 메모로 시작하세요.</h3>
            <p>처음부터 모든 내용을 채울 필요는 없어요. 기억나는 내용만 먼저 적어주세요.</p>
            <div className="form-flow">
              <span>
                <Check size={14} />
                경험 자료 등록
              </span>
              <i />
              <span>
                <Sparkles size={14} />
                경험 구조화
              </span>
              <i />
              <span>
                <Pencil size={14} />
                내용 확인 · 수정
              </span>
              <i />
              <span>
                <Layers3 size={14} />
                라이브러리에 저장
              </span>
            </div>
          </div>
          <div className="aside-trust">
            <ShieldCheck size={22} />
            <h3>사실을 바꾸지 않아요.</h3>
            <p>
              확인할 수 없는 성과를 만들거나 숫자를 과장하지 않아요. 빠진 내용은 직접 확인할 수
              있도록 표시해드려요.
            </p>
            <Badge tone="amber">사용자 확인 필요</Badge>
          </div>
          <HelpNote>
            이 버전의 분석은 입력을 구조화하는 데모입니다. 실제 AI API는 이후 연결됩니다.
          </HelpNote>
        </aside>
      </div>
    </>
  );
}
function NotFoundExperience() {
  return (
    <Empty
      icon={<Layers3 size={30} />}
      title="경험을 찾을 수 없습니다."
      description="다른 브라우저에서 저장한 경험이거나 존재하지 않는 주소입니다."
    >
      <Button asChild>
        <Link href="/experience">라이브러리로 이동</Link>
      </Button>
    </Empty>
  );
}
export function AnalysisScreen({ id }: { id: string }) {
  const { data, update, toast } = useStore();
  const router = useRouter();
  const original = data.experiences.find((e) => e.id === id);
  const [step, setStep] = useState(0);
  const [claims, setClaims] = useState<Claim[]>(original?.claims || []);
  const [editing, setEditing] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const t = setInterval(() => setStep((s) => Math.min(s + 1, 3)), 650);
    return () => clearInterval(t);
  }, [id]);
  if (!original) return <NotFoundExperience />;
  const approve = () => {
    if (!confirmed) {
      setError("실제로 수행한 경험인지 확인해 주세요.");
      return;
    }
    const manualId = id + "-review";
    const edited = claims.map((c) =>
      c.content.trim() && c.content !== "사용자 확인 필요"
        ? {
            ...c,
            status: c.status === "needs_review" ? ("user_confirmed" as const) : c.status,
            evidenceIds: c.evidenceIds.length ? c.evidenceIds : [manualId],
          }
        : { ...c, content: "사용자 확인 필요", status: "needs_review" as const, evidenceIds: [] },
    );
    const evidence = original.evidence.filter((e) => e.id !== manualId);
    evidence.push({
      id: manualId,
      type: "manual",
      source: "사용자가 검토한 분석",
      reference: "최종 확인 원문",
      content: edited
        .filter((c) => c.status === "user_confirmed")
        .map((c) => c.section + ": " + c.content)
        .join("\n"),
      status: "user_confirmed",
    });
    update((d) => ({
      ...d,
      experiences: d.experiences.map((e) =>
        e.id === id
          ? {
              ...e,
              claims: edited,
              role: edited.find((claim) => claim.section === "role")?.content || e.role,
              evidence,
              status: "approved",
            }
          : e,
      ),
    }));
    toast("확인한 경험이 라이브러리에 저장되었습니다.");
    router.push("/experience/" + id);
  };
  return (
    <>
      <Link className="back-link" href={"/experience/" + id}>
        <ArrowLeft size={16} />
        경험으로 돌아가기
      </Link>
      <PageHeading
        eyebrow="EXPERIENCE ANALYSIS"
        title={step < 3 ? "경험의 핵심을 정리하고 있어요." : "경험이 정리되었어요. 확인해볼까요?"}
        description={
          step < 3
            ? "입력한 사실을 바탕으로, 역할과 행동을 구조화합니다."
            : "내용을 수정하고 실제로 수행한 경험인지 확인한 뒤 저장하세요."
        }
      />
      <div className="analysis-progress panel">
        <div className="analysis-project">
          <ProjectIcon experience={original} />
          <div>
            <strong>{original.title}</strong>
            <span>{original.role}</span>
          </div>
          <Badge tone={step < 3 ? "blue" : "green"}>{step < 3 ? "분석 중" : "초안 완성"}</Badge>
        </div>
        <Progress value={Math.round((step / 3) * 100)} label="분석 진행도" />
        <div className="analysis-steps">
          {["입력 내용 확인", "경험 구조화", "근거 연결", "사용자 확인"].map((text, i) => (
            <span key={text} className={step >= i ? "complete" : ""}>
              {step > i ? <Check size={14} /> : <span className="step-dot">{i + 1}</span>}
              {text}
            </span>
          ))}
        </div>
      </div>
      {step < 3 ? (
        <div className="analysis-loading">
          {[1, 2, 3].map((i) => (
            <div key={i} className="panel">
              <Skeleton className="skeleton-title" />
              <Skeleton />
              <Skeleton />
            </div>
          ))}
          <p>
            <Sparkles size={16} />
            입력 내용을 구조화하는 데모 분석이 진행 중입니다.
          </p>
        </div>
      ) : (
        <div className="detail-columns">
          <div>
            <div className="info-banner">
              <ShieldCheck size={18} />
              첨부 자료의 내용은 추측하지 않아요. 직접 입력한 내용과 연결되는 근거를 확인해주세요.
            </div>
            {claims.map((claim, index) => {
              const section = sections.find((s) => s.key === claim.section)!;
              return (
                <section className="claim-panel panel" key={claim.section}>
                  <div className="claim-heading">
                    <div>
                      <span className="claim-number">0{index + 1}</span>
                      <h2>{section.label}</h2>
                      <span>{section.question}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditing(editing === claim.section ? null : claim.section)}
                    >
                      <Pencil size={14} />
                      {editing === claim.section ? "완료" : "수정"}
                    </Button>
                  </div>
                  {editing === claim.section ? (
                    <textarea
                      aria-label={section.label + " 수정"}
                      rows={4}
                      value={claim.content === "사용자 확인 필요" ? "" : claim.content}
                      placeholder={section.question}
                      onChange={(e) =>
                        setClaims((v) =>
                          v.map((c) =>
                            c.section === claim.section
                              ? {
                                  ...c,
                                  content: e.target.value,
                                  status: "user_confirmed",
                                  evidenceIds: [],
                                }
                              : c,
                          ),
                        )
                      }
                    />
                  ) : (
                    <p
                      className={
                        claim.content === "사용자 확인 필요" ? "needs-review-copy" : "claim-content"
                      }
                    >
                      {claim.content}
                    </p>
                  )}
                  <div className="claim-source">
                    {claim.content === "사용자 확인 필요" ? (
                      <Badge tone="amber">
                        <CircleAlert size={12} />
                        사용자 확인 필요
                      </Badge>
                    ) : (
                      <Badge tone="blue">
                        <ShieldCheck size={12} />
                        {claim.status === "source_verified"
                          ? "예시 원본 근거 연결"
                          : "사용자 입력 기반"}
                      </Badge>
                    )}
                  </div>
                </section>
              );
            })}
            <div className="approve-panel panel">
              <label className="check-label">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => {
                    setConfirmed(e.target.checked);
                    setError("");
                  }}
                />
                <span>
                  위 내용을 확인했으며, 실제로 수행한 경험입니다.
                  <small>빠진 내용은 확인 필요 상태로 저장되어 나중에 수정할 수 있습니다.</small>
                </span>
              </label>
              {error && (
                <p className="form-error" role="alert">
                  {error}
                </p>
              )}
              <Button onClick={approve} disabled={!confirmed}>
                <CheckCheck size={17} />
                확인하고 라이브러리에 저장
              </Button>
            </div>
          </div>
          <aside>
            <div className="panel detail-aside">
              <h3>연결된 근거</h3>
              <p className="muted">각 내용이 어디에서 왔는지 확인하세요.</p>
              <EvidenceList items={original.evidence} isDemo={original.isDemo} />
            </div>
            <div className="aside-trust">
              <ShieldCheck size={22} />
              <h3>내 경험에 대한 결정은 내가.</h3>
              <p>분석은 초안이에요. 맞지 않는 표현은 바꾸고, 부족한 내용은 천천히 채워주세요.</p>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
export function ExperienceDetail({ id }: { id: string }) {
  const { data } = useStore();
  const [tab, setTab] = useState("analysis");
  const e = data.experiences.find((v) => v.id === id);
  if (!e) return <NotFoundExperience />;
  return (
    <>
      <Link className="back-link" href="/experience">
        <ArrowLeft size={16} />
        경험 라이브러리
      </Link>
      <div className="experience-detail-header">
        <ProjectIcon experience={e} />
        <div>
          <div className="tag-row">
            <Badge>{e.type}</Badge>
            <Badge tone={e.status === "approved" ? "green" : "amber"}>
              {e.status === "approved" ? "분석 완료" : "검토 필요"}
            </Badge>
            {e.isDemo && <Badge tone="blue">예시 경험</Badge>}
          </div>
          <h1>{e.title}</h1>
          <p>{e.description}</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={"/experience/" + id + "/analyze"}>
            <Pencil size={15} />
            {e.status === "review" ? "분석 검토하기" : "내용 수정"}
          </Link>
        </Button>
      </div>
      <div className="experience-metadata">
        <span>
          <UserRound size={16} />
          {e.role}
        </span>
        <span>
          <CalendarDays size={16} />
          {period(e.startDate, e.endDate)}
        </span>
        <span>
          <Building2 size={16} />
          {e.organization || "소속 미등록"}
        </span>
      </div>
      <div className="detail-tabs" role="tablist" aria-label="경험 상세 보기">
        <button
          role="tab"
          aria-selected={tab === "analysis"}
          onClick={() => setTab("analysis")}
          className={tab === "analysis" ? "active" : ""}
        >
          경험 분석
        </button>
        <button
          role="tab"
          aria-selected={tab === "evidence"}
          onClick={() => setTab("evidence")}
          className={tab === "evidence" ? "active" : ""}
        >
          Evidence <span>{e.evidence.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={tab === "original"}
          onClick={() => setTab("original")}
          className={tab === "original" ? "active" : ""}
        >
          등록 원문
        </button>
      </div>
      <div className="detail-columns">
        <div>
          {tab === "analysis" ? (
            e.claims.map((claim, index) => {
              const s = sections.find((s) => s.key === claim.section)!;
              return (
                <section className="claim-panel panel" key={claim.section}>
                  <div className="claim-heading">
                    <div>
                      <span className="claim-number">0{index + 1}</span>
                      <h2>{s.label}</h2>
                    </div>
                    <Badge
                      tone={
                        claim.status === "needs_review"
                          ? "amber"
                          : claim.status === "source_verified"
                            ? "green"
                            : "blue"
                      }
                    >
                      {claim.status === "needs_review"
                        ? "확인 필요"
                        : claim.status === "source_verified"
                          ? "예시 근거 연결"
                          : "사용자 확인"}
                    </Badge>
                  </div>
                  <p
                    className={
                      claim.status === "needs_review" ? "needs-review-copy" : "claim-content"
                    }
                  >
                    {claim.content}
                  </p>
                  {claim.evidenceIds.length > 0 && (
                    <div className="claim-inline-evidence">
                      <ShieldCheck size={14} />
                      <span>연결된 근거</span>
                      <EvidenceList
                        items={e.evidence.filter((v) => claim.evidenceIds.includes(v.id))}
                        isDemo={e.isDemo}
                      />
                    </div>
                  )}
                </section>
              );
            })
          ) : tab === "evidence" ? (
            <section className="panel evidence-detail">
              <h2>경험의 근거 자료</h2>
              <p className="muted">각 자료를 클릭하면 등록된 발췌와 위치를 확인할 수 있어요.</p>
              {e.isDemo && (
                <HelpNote>
                  아래 자료는 UI를 설명하기 위한 예시이며 실제 저장소나 PDF가 아닙니다.
                </HelpNote>
              )}
              <EvidenceList items={e.evidence} isDemo={e.isDemo} />
            </section>
          ) : (
            <section className="panel original-detail">
              <h2>등록한 경험 원문</h2>
              <h3>경험 설명</h3>
              <p>{e.description}</p>
              <h3>내 역할</h3>
              <p>{e.role}</p>
              <h3>사용 기술</h3>
              <p>{e.skills.join(", ") || "미등록"}</p>
              <EvidenceList
                items={e.evidence.filter((v) => v.type === "manual")}
                isDemo={e.isDemo}
              />
            </section>
          )}
        </div>
        <aside>
          <div className="panel detail-aside">
            <div className="section-heading">
              <h3>경험 완성도</h3>
              <strong className="primary-text">{completeness(e)}%</strong>
            </div>
            <Progress value={completeness(e)} />
            <p className="muted">역할과 행동, 결과가 구체적일수록 나를 더 잘 소개할 수 있어요.</p>
            <div className="completion-checklist">
              {sections.map((s) => {
                const c = e.claims.find((c) => c.section === s.key);
                return (
                  <div key={s.key}>
                    <span className={c?.status === "needs_review" ? "" : "done"}>
                      {c?.status === "needs_review" ? <Clock3 size={14} /> : <Check size={14} />}
                    </span>
                    {s.label}
                    <small>{c?.status === "needs_review" ? "확인 필요" : "정리 완료"}</small>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="panel detail-aside">
            <h3>사용 기술 · 핵심 역량</h3>
            <div className="tag-row">
              {e.skills.map((s) => (
                <Badge tone="blue" key={s}>
                  {s}
                </Badge>
              ))}
            </div>
            {e.competencies.length > 0 && (
              <div className="tag-row competencies">
                {e.competencies.map((c) => (
                  <Badge key={c}>{c}</Badge>
                ))}
              </div>
            )}
          </div>
          <div className="next-step-card">
            <span>
              <TargetIcon />
            </span>
            <h3>이 경험, 어디에 어울릴까요?</h3>
            <p>
              관심 있는 공고와 연결해
              <br />내 경험의 가능성을 확인하세요.
            </p>
            <Button asChild variant="outline" className="full-width">
              <Link href="/jobs">
                지원 공고 살펴보기
                <ArrowUpRight size={15} />
              </Link>
            </Button>
          </div>
        </aside>
      </div>
      <VerificationNote />
    </>
  );
}
function TargetIcon() {
  return <BriefcaseIcon />;
}
function BriefcaseIcon() {
  return <Layers3 size={21} />;
}
