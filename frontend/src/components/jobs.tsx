"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  ArrowLeft,
  ArrowUpRight,
  ExternalLink,
  BriefcaseBusiness,
  Sparkles,
  Check,
  CircleHelp,
  ShieldCheck,
  Target,
  ChevronDown,
  ChevronUp,
  PanelsTopLeft,
  CircleAlert,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { parseJob, parseResponsibilities, rankExperiences, skillGap } from "@/lib/mock-analysis";
import type { Job } from "@folio/shared";
import { Button } from "./ui/button";
import { Badge, Empty, Progress } from "./ui/primitives";
import {
  PageHeading,
  SectionHeading,
  JobLogo,
  ScoreRing,
  ProjectIcon,
  NothingFound,
  HelpNote,
  VerificationNote,
} from "./shared";
export function JobLibrary() {
  const { data } = useStore();
  const [query, setQuery] = useState("");
  const jobs = data.jobs.filter((j) =>
    (j.company + " " + j.position + " " + j.skills.map((s) => s.name).join(" "))
      .toLowerCase()
      .includes(query.toLowerCase()),
  );
  return (
    <>
      <PageHeading
        eyebrow="LIBRARY / JOB NOTES"
        title="채용공고 노트"
        description="관심 있는 공고를 읽고, 내 경험과 이어지는 지점을 찾아보세요."
        action={
          <Button asChild>
            <Link href="/jobs/new">
              <Plus size={17} />
              공고 등록
            </Link>
          </Button>
        }
      />
      <div className="jobs-intro">
        <Target size={26} />
        <div>
          <h3>공고가 달라져도, 나의 경험은 계속 쌓여요.</h3>
          <p>같은 경험에서도 직무에 맞는 새로운 강점을 발견해보세요.</p>
        </div>
      </div>
      <div className="library-toolbar">
        <div className="search-field">
          <Search size={17} />
          <input
            placeholder="기업, 직무, 기술 검색"
            aria-label="공고 검색"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <span className="muted">{jobs.length}개의 관심 공고</span>
      </div>
      {!data.jobs.length ? (
        <Empty
          icon={<BriefcaseBusiness size={30} />}
          title="아직 등록된 공고가 없어요."
          description="지원하고 싶은 채용공고를 넣고, 내 경험과 연결해보세요."
        >
          <Button asChild>
            <Link href="/jobs/new">
              <Plus size={16} />첫 공고 등록하기
            </Link>
          </Button>
        </Empty>
      ) : !jobs.length ? (
        <NothingFound />
      ) : (
        <div className="jobs-grid">
          {jobs.map((j) => {
            const matches = rankExperiences(data.experiences, j);
            const gap = skillGap(data.experiences, j);
            return (
              <Link href={"/jobs/" + j.id} className="job-card panel" key={j.id}>
                <div className="job-card-top">
                  <JobLogo company={j.company} />
                  <Badge tone={j.isDemo ? "neutral" : "blue"}>
                    {j.isDemo ? "예시 공고" : "분석 완료"}
                  </Badge>
                  <ArrowUpRight size={18} />
                </div>
                <div className="job-card-title">
                  <span>{j.company}</span>
                  <h2>{j.position}</h2>
                </div>
                <div className="tag-row">
                  {j.skills
                    .filter((s) => s.kind === "required")
                    .slice(0, 3)
                    .map((s) => (
                      <Badge key={s.name}>{s.name}</Badge>
                    ))}
                </div>
                <div className="job-card-fit">
                  <div>
                    <span>가장 잘 맞는 경험</span>
                    <strong>{matches[0]?.experience.title || "경험을 먼저 등록해주세요"}</strong>
                  </div>
                  <span>
                    {matches[0]?.score || 0}
                    <small>%</small>
                  </span>
                </div>
                <Progress value={matches[0]?.score || 0} label="최고 적합도" />
                <div className="job-card-foot">
                  <span>
                    <ShieldCheck size={14} />
                    {j.skills.length - gap.length}개 요구 역량 연결
                  </span>
                  <span>{gap.length}개 확인 필요</span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      <VerificationNote />
    </>
  );
}
export function NewJob() {
  const router = useRouter();
  const { update, toast } = useStore();
  const [company, setCompany] = useState("");
  const [position, setPosition] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [extra, setExtra] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (url && !/^https?:\/\//.test(url)) {
      setError("http 또는 https로 시작하는 공고 URL을 입력해 주세요.");
      return;
    }
    const skills = parseJob(description, extra);
    if (!skills.length) {
      setError(
        "확인할 역량을 찾지 못했습니다. 아래 핵심 역량에 공고가 요구하는 기술을 입력해 주세요.",
      );
      return;
    }
    setLoading(true);
    const job: Job = {
      id: crypto.randomUUID(),
      company: company.trim(),
      position: position.trim(),
      url,
      description,
      skills,
      responsibilities: parseResponsibilities(description),
      createdAt: new Date().toISOString(),
    };
    update((d) => ({ ...d, jobs: [job, ...d.jobs] }));
    toast("공고의 요구 역량이 정리되었습니다.");
    router.push("/jobs/" + job.id);
  };
  return (
    <>
      <Link href="/jobs" className="back-link">
        <ArrowLeft size={16} />
        지원 공고
      </Link>
      <PageHeading
        eyebrow="NEW JOB POSTING"
        title="어떤 기회에 도전하고 싶나요?"
        description="채용공고를 넣으면, 필요한 역량과 어울리는 경험을 함께 살펴볼 수 있어요."
      />
      <div className="form-with-aside">
        <form className="panel job-form" onSubmit={submit}>
          <div className="form-section-title">
            <span>01</span>
            <div>
              <h2>지원하는 기업과 직무</h2>
              <p>공고에 나온 내용을 그대로 알려주세요.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              기업 이름 <i>*</i>
              <input
                required
                value={company}
                maxLength={100}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="예: 토스"
              />
            </label>
            <label>
              지원 직무 <i>*</i>
              <input
                required
                value={position}
                maxLength={150}
                onChange={(e) => setPosition(e.target.value)}
                placeholder="예: Frontend Developer"
              />
            </label>
          </div>
          <label>
            채용공고 URL <Badge>선택</Badge>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://careers.company.com/job"
            />
            <small>URL은 참고 링크로 보관돼요. 분석할 공고 내용을 아래에 붙여넣어 주세요.</small>
          </label>
          <div className="form-divider" />
          <div className="form-section-title">
            <span>02</span>
            <div>
              <h2>채용공고 내용</h2>
              <p>주요 업무, 필수 조건, 우대 조건이 포함되면 좋아요.</p>
            </div>
          </div>
          <label>
            공고 본문 <i>*</i>
            <textarea
              required
              rows={11}
              maxLength={20000}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                "주요 업무\nReact 기반 웹 서비스 개발, API 연동\n\n필수 역량\nReact, JavaScript, Collaboration\n\n우대 사항\nTypeScript, Testing"
              }
            />
          </label>
          <label>
            핵심 역량 <Badge>선택</Badge>
            <input
              value={extra}
              maxLength={1000}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="예: React, TypeScript, Testing (쉼표로 구분)"
            />
            <small>본문에서 놓친 역량을 직접 추가할 수 있어요.</small>
          </label>
          {error && (
            <div className="form-error" role="alert">
              <CircleAlert size={16} />
              {error}
            </div>
          )}
          <div className="form-footer">
            <span>
              <ShieldCheck size={15} />
              등록한 공고 내용으로 분석합니다.
            </span>
            <Button disabled={loading}>
              <Sparkles size={17} />
              {loading ? "분석 중…" : "공고 분석하기"}
            </Button>
          </div>
        </form>
        <aside className="form-aside">
          <div className="aside-help">
            <Target size={26} />
            <h3>경험과 기회를 연결하세요.</h3>
            <p>공고에서 찾은 요구 역량을 내 경험과 비교하고, 강조하면 좋은 프로젝트를 추천해요.</p>
            <div className="form-flow">
              <span>
                <BriefcaseBusiness size={15} />
                주요 업무 · 요구 역량 정리
              </span>
              <i />
              <span>
                <Sparkles size={15} />내 경험과 적합도 비교
              </span>
              <i />
              <span>
                <CircleHelp size={15} />
                확인되지 않은 역량 발견
              </span>
              <i />
              <span>
                <PanelsTopLeft size={15} />
                맞춤 포트폴리오 구성
              </span>
            </div>
          </div>
          <HelpNote>
            이번 버전은 기술 이름과 명시된 우대 조건을 기준으로 분석합니다. 의미 기반 AI 분석은 이후
            연결됩니다.
          </HelpNote>
        </aside>
      </div>
    </>
  );
}
function JobMissing() {
  return (
    <Empty
      icon={<BriefcaseBusiness size={28} />}
      title="공고를 찾을 수 없습니다."
      description="등록한 공고 목록에서 다시 선택해 주세요."
    >
      <Button asChild>
        <Link href="/jobs">지원 공고로 이동</Link>
      </Button>
    </Empty>
  );
}
export function JobDetail({ id }: { id: string }) {
  const { data } = useStore();
  const [tab, setTab] = useState("analysis");
  const job = data.jobs.find((j) => j.id === id);
  if (!job) return <JobMissing />;
  const ranked = rankExperiences(data.experiences, job);
  const gap = skillGap(data.experiences, job);
  return (
    <>
      <Link href="/jobs" className="back-link">
        <ArrowLeft size={16} />
        지원 공고
      </Link>
      <div className="job-detail-header">
        <JobLogo company={job.company} />
        <div>
          <div className="tag-row">
            <span>{job.company}</span>
            <Badge tone={job.isDemo ? "neutral" : "blue"}>
              {job.isDemo ? "예시 공고" : "공고 분석 완료"}
            </Badge>
          </div>
          <h1>{job.position}</h1>
          <p>어떤 역량을 찾고 있는지, 내 경험은 어떻게 연결되는지 확인하세요.</p>
        </div>
        {job.url && (
          <Button asChild variant="outline">
            <a href={job.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink size={15} />
              원본 공고
            </a>
          </Button>
        )}
      </div>
      <div className="detail-tabs" role="tablist" aria-label="공고 보기">
        <button
          role="tab"
          aria-selected={tab === "analysis"}
          className={tab === "analysis" ? "active" : ""}
          onClick={() => setTab("analysis")}
        >
          역량 분석
        </button>
        <button
          role="tab"
          aria-selected={tab === "original"}
          className={tab === "original" ? "active" : ""}
          onClick={() => setTab("original")}
        >
          공고 원문
        </button>
      </div>
      <div className="detail-columns">
        <div>
          {tab === "original" ? (
            <div className="panel original-detail">
              <h2>등록한 공고 원문</h2>
              <p className="pre-line">{job.description}</p>
            </div>
          ) : (
            <>
              <section className="panel job-analysis-section">
                <h2>
                  <BriefcaseBusiness size={19} />
                  주요 업무
                </h2>
                <ul className="responsibility-list">
                  {job.responsibilities.map((r) => (
                    <li key={r}>{r}</li>
                  ))}
                </ul>
              </section>
              <section className="panel job-analysis-section">
                <h2>
                  <ShieldCheck size={19} />
                  필수 역량
                </h2>
                <p className="muted">공고에 명시된 핵심 기술과 역량이에요.</p>
                <div className="requirement-list">
                  {job.skills
                    .filter((s) => s.kind === "required")
                    .map((s) => (
                      <div key={s.name}>
                        <Badge tone="blue">{s.name}</Badge>
                        <span>
                          {gap.some((g) => g.name === s.name) ? (
                            <Badge tone="amber">현재 근거 없음</Badge>
                          ) : (
                            <span className="confirmed-label">
                              <Check size={14} />
                              경험에서 확인
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                </div>
              </section>
              <section className="panel job-analysis-section">
                <h2>
                  <Sparkles size={19} />
                  우대 역량
                </h2>
                {job.skills.filter((s) => s.kind === "preferred").length ? (
                  <div className="requirement-list">
                    {job.skills
                      .filter((s) => s.kind === "preferred")
                      .map((s) => (
                        <div key={s.name}>
                          <Badge>{s.name}</Badge>
                          {gap.some((g) => g.name === s.name) ? (
                            <Badge tone="amber">확인 필요</Badge>
                          ) : (
                            <span className="confirmed-label">
                              <Check size={14} />
                              경험에서 확인
                            </span>
                          )}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="muted">별도로 확인된 우대 역량이 없습니다.</p>
                )}
              </section>
              <section className="panel job-analysis-section">
                <h2>
                  <CircleHelp size={19} />
                  확인되지 않은 역량
                </h2>
                <p className="muted">
                  역량이 없다는 뜻이 아니라, 현재 경험에서 사용 근거를 찾지 못했다는 뜻이에요.
                </p>
                <div className="skill-gap-list">
                  {gap.map((s) => (
                    <div key={s.name}>
                      <span className="gap-icon">
                        <CircleHelp size={16} />
                      </span>
                      <div>
                        <strong>{s.name}</strong>
                        <p>현재 경험에서는 {s.name} 사용 근거를 확인하지 못했습니다.</p>
                      </div>
                      <Badge tone="amber">{s.kind === "required" ? "필수" : "우대"}</Badge>
                    </div>
                  ))}
                </div>
                {!gap.length && (
                  <div className="success-banner">
                    <Check size={17} />
                    모든 요구 역량이 경험과 연결되어 있어요.
                  </div>
                )}
              </section>
            </>
          )}
        </div>
        <aside>
          <div className="panel match-summary">
            <div className="eyebrow">EXPERIENCE FIT</div>
            <h3>나의 경험과 얼마나 맞을까요?</h3>
            <ScoreRing score={ranked[0]?.score || 0} size={112} />
            <strong className="match-summary-title">
              {ranked[0]?.experience.title || "경험을 먼저 등록해주세요"}
            </strong>
            <p>{ranked[0]?.matched.length || 0}개 요구 역량이 가장 적합한 경험과 연결됩니다.</p>
            <Button asChild className="full-width">
              <Link href={"/jobs/" + id + "/match"}>
                경험 매칭 살펴보기
                <ArrowUpRight size={15} />
              </Link>
            </Button>
            <HelpNote>점수는 요구 역량의 가중 커버리지이며 채용 성공 확률이 아닙니다.</HelpNote>
          </div>
          <div className="panel detail-aside">
            <h3>핵심 키워드</h3>
            <div className="tag-row">
              {job.skills.map((s) => (
                <Badge key={s.name}>{s.name}</Badge>
              ))}
            </div>
          </div>
          {job.isDemo && (
            <HelpNote>
              제품 흐름을 설명하기 위한 예시입니다. 실제 기업의 현재 공고와 다를 수 있습니다.
            </HelpNote>
          )}
        </aside>
      </div>
    </>
  );
}
export function JobMatch({ id }: { id: string }) {
  const { data, update, toast } = useStore();
  const router = useRouter();
  const job = data.jobs.find((j) => j.id === id);
  const ranked = job ? rankExperiences(data.experiences, job) : [];
  const [expanded, setExpanded] = useState<string | null>(ranked[0]?.experience.id || null);
  const [selected, setSelected] = useState<string[]>(
    ranked
      .filter((r) => r.score > 0)
      .slice(0, 2)
      .map((r) => r.experience.id),
  );
  const [error, setError] = useState("");
  if (!job) return <JobMissing />;
  const gap = skillGap(data.experiences, job);
  const toggle = (experienceId: string) => {
    setSelected((s) =>
      s.includes(experienceId) ? s.filter((v) => v !== experienceId) : [...s, experienceId],
    );
    setError("");
  };
  const create = () => {
    if (!selected.length) {
      setError("포트폴리오에 포함할 경험을 선택해주세요.");
      return;
    }
    const portfolioId = crypto.randomUUID();
    update((d) => ({
      ...d,
      portfolios: [
        {
          id: portfolioId,
          jobId: id,
          title: job.company + " · " + job.position,
          slug: "portfolio-" + portfolioId.slice(0, 8),
          visibility: "private",
          experienceIds: selected,
          createdAt: new Date().toISOString(),
        },
        ...d.portfolios,
      ],
    }));
    toast("선택한 경험으로 포트폴리오 초안을 만들었습니다.");
    router.push("/portfolio/" + portfolioId);
  };
  return (
    <>
      <Link href={"/jobs/" + id} className="back-link">
        <ArrowLeft size={16} />
        공고 분석
      </Link>
      <PageHeading
        eyebrow="EXPERIENCE × OPPORTUNITY"
        title="이 기회에 어울리는 나의 경험"
        description={
          job.company + " · " + job.position + "에 가장 잘 맞는 경험과 그 이유를 살펴보세요."
        }
      />
      <div className="match-job-strip">
        <JobLogo company={job.company} />
        <div>
          <strong>{job.company}</strong>
          <span>{job.position}</span>
        </div>
        <div className="tag-row">
          {job.skills
            .filter((s) => s.kind === "required")
            .slice(0, 4)
            .map((s) => (
              <Badge key={s.name}>{s.name}</Badge>
            ))}
        </div>
        <Badge tone="blue">{ranked.length}개 경험 비교</Badge>
      </div>
      <div className="detail-columns">
        <div>
          <SectionHeading
            title="추천 경험"
            description="실제로 확인된 역량을 기준으로 정렬했어요."
          />
          {ranked.map((match, index) => {
            const e = match.experience;
            return (
              <div
                key={e.id}
                className={"match-card panel" + (selected.includes(e.id) ? " selected" : "")}
              >
                <div className="match-card-main">
                  <label className="match-select">
                    <input
                      type="checkbox"
                      aria-label={e.title + " 선택"}
                      checked={selected.includes(e.id)}
                      onChange={() => toggle(e.id)}
                    />
                    <span>{index + 1}</span>
                  </label>
                  <ProjectIcon experience={e} />
                  <div className="match-card-info">
                    <Link href={"/experience/" + e.id}>
                      {e.title}
                      <ArrowUpRight size={14} />
                    </Link>
                    <p>{e.role}</p>
                    <div className="tag-row">
                      {match.matched.slice(0, 4).map((s) => (
                        <Badge key={s.name} tone="blue">
                          {s.name}
                        </Badge>
                      ))}
                      {!match.matched.length && (
                        <span className="muted">연결된 요구 역량 없음</span>
                      )}
                    </div>
                  </div>
                  <div className="match-percent">
                    <strong>
                      {match.score}
                      <small>%</small>
                    </strong>
                    <span>Match</span>
                  </div>
                </div>
                <button
                  className="match-reason-toggle"
                  aria-expanded={expanded === e.id}
                  onClick={() => setExpanded(expanded === e.id ? null : e.id)}
                >
                  <ShieldCheck size={15} />왜 이 경험이 추천되었나요?
                  {expanded === e.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                </button>
                {expanded === e.id && (
                  <div className="match-reasons">
                    <h4>확인된 연결점</h4>
                    {match.reasons.length ? (
                      match.reasons.map((reason) => (
                        <p key={reason}>
                          <Check size={14} />
                          {reason}
                        </p>
                      ))
                    ) : (
                      <p>현재 공고의 요구 역량과 연결되는 사용 근거를 확인하지 못했습니다.</p>
                    )}
                    <div className="match-missing">
                      <span>이 경험에서 확인되지 않은 역량</span>
                      <div className="tag-row">
                        {match.missing.map((s) => (
                          <Badge key={s.name}>{s.name}</Badge>
                        ))}
                      </div>
                    </div>
                    <small>
                      필수 역량 가중치 5 · 우대 역량 가중치 2 · 사용자 확인 입력은 0.75 계수를
                      적용합니다.
                    </small>
                  </div>
                )}
              </div>
            );
          })}
          {!ranked.length && (
            <Empty
              icon={<Target size={28} />}
              title="먼저 경험을 확인해주세요."
              description="등록한 경험을 분석하고 승인하면 적합도를 비교할 수 있어요."
            >
              <Button asChild>
                <Link href="/experience">경험 라이브러리로 이동</Link>
              </Button>
            </Empty>
          )}
        </div>
        <aside className="sticky-aside">
          <div className="panel portfolio-create-panel">
            <span className="tip-symbol">
              <PanelsTopLeft size={22} />
            </span>
            <h3>내 경험을, 나의 이야기로.</h3>
            <p>
              강조하고 싶은 경험을 골라
              <br />이 기업에 맞는 포트폴리오를 만드세요.
            </p>
            <div className="selected-count">
              <span>선택한 경험</span>
              <strong>{selected.length}개</strong>
            </div>
            {selected.map((experienceId) => {
              const e = data.experiences.find((e) => e.id === experienceId);
              return (
                e && (
                  <div className="selected-mini" key={e.id}>
                    <ProjectIcon experience={e} small />
                    <span>{e.title}</span>
                    <button aria-label={e.title + " 선택 해제"} onClick={() => toggle(e.id)}>
                      ×
                    </button>
                  </div>
                )
              );
            })}
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <Button onClick={create} className="full-width" disabled={!selected.length}>
              <Sparkles size={16} />
              포트폴리오 만들기
            </Button>
            <small>선택과 순서는 이후에도 바꿀 수 있어요.</small>
          </div>
          <div className="panel detail-aside">
            <h3>Skill Gap</h3>
            <p className="muted">라이브러리 전체에서 아직 확인하지 못한 역량이에요.</p>
            <div className="tag-row">
              {gap.map((s) => (
                <Badge tone="amber" key={s.name}>
                  {s.name}
                </Badge>
              ))}
              {!gap.length && <Badge tone="green">모든 역량 연결됨</Badge>}
            </div>
            <Link className="subtle-link" href={"/jobs/" + id}>
              자세히 살펴보기
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <HelpNote>
            직무의 의미적 연관성까지 비교하는 AI 분석은 다음 단계입니다. 현재 점수는 등록된 역량의
            가중 커버리지입니다.
          </HelpNote>
        </aside>
      </div>
      <VerificationNote />
    </>
  );
}
