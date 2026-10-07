"use client";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  ArrowUpRight,
  ArrowUp,
  ArrowDown,
  Plus,
  PanelsTopLeft,
  Pencil,
  Share2,
  ShieldCheck,
  LockKeyhole,
  X,
  Mail,
  Layers3,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { sections, type Portfolio } from "@folio/shared";
import { period } from "@/lib/utils";
import { Button } from "./ui/button";
import { Badge, Empty } from "./ui/primitives";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { PageHeading, ProjectIcon, EvidenceList, HelpNote, VerificationNote } from "./shared";
export function PortfolioLibrary() {
  const { data } = useStore();
  return (
    <>
      <PageHeading
        eyebrow="LIBRARY / PORTFOLIOS"
        title="나의 포트폴리오"
        description="경험 문서를 골라, 지원하는 곳에 맞는 한 권의 이야기로 엮어보세요."
        action={
          <Button asChild>
            <Link href="/jobs">
              <Plus size={17} />새 포트폴리오 만들기
            </Link>
          </Button>
        }
      />
      {!data.portfolios.length ? (
        <Empty
          icon={<PanelsTopLeft size={30} />}
          title="아직 만든 포트폴리오가 없어요."
          description="관심 공고와 경험을 매칭하고, 첫 포트폴리오를 만들어보세요."
        >
          <Button asChild>
            <Link href="/jobs">공고에서 포트폴리오 만들기</Link>
          </Button>
        </Empty>
      ) : (
        <div className="portfolio-grid">
          {data.portfolios.map((p) => {
            const job = data.jobs.find((j) => j.id === p.jobId);
            const experiences = p.experienceIds
              .map((id) => data.experiences.find((e) => e.id === id))
              .filter((e) => !!e);
            return (
              <Link className="portfolio-card panel" key={p.id} href={"/portfolio/" + p.id}>
                <div className="portfolio-cover">
                  <div className="portfolio-mini-line" />
                  <span>{data.profile.name.toUpperCase()} / PORTFOLIO</span>
                  <h3>{job?.position || "My Portfolio"}</h3>
                  <div className="portfolio-mini-projects">
                    {experiences.slice(0, 3).map((e) => (
                      <div key={e.id}>
                        <ProjectIcon experience={e} small />
                        <span>{e.title}</span>
                      </div>
                    ))}
                  </div>
                  <span className="cover-folio">folio.</span>
                </div>
                <div className="portfolio-card-info">
                  <Badge>
                    <LockKeyhole size={12} />
                    비공개 초안
                  </Badge>
                  <h2>{p.title}</h2>
                  <p>
                    {experiences.length}개 경험 · {p.createdAt.slice(0, 10).replaceAll("-", ".")}
                  </p>
                  <span>
                    포트폴리오 살펴보기
                    <ArrowUpRight size={15} />
                  </span>
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
export function PortfolioPreview({ id }: { id: string }) {
  const { data, update, toast } = useStore();
  const [edit, setEdit] = useState(false);
  const [share, setShare] = useState(false);
  const [device, setDevice] = useState("desktop");
  const [addId, setAddId] = useState("");
  const [copying, setCopying] = useState(false);
  const p = data.portfolios.find((p) => p.id === id);
  if (!p)
    return (
      <Empty
        icon={<PanelsTopLeft size={30} />}
        title="포트폴리오를 찾을 수 없습니다."
        description="이 브라우저에 저장된 포트폴리오 목록에서 선택해 주세요."
      >
        <Button asChild>
          <Link href="/portfolio">목록으로 이동</Link>
        </Button>
      </Empty>
    );
  const job = data.jobs.find((j) => j.id === p.jobId);
  const experiences = p.experienceIds
    .map((id) => data.experiences.find((e) => e.id === id))
    .filter((e) => !!e);
  const skills = [...new Set(experiences.flatMap((e) => e.skills))];
  const patch = (change: Partial<Portfolio>) =>
    update((d) => ({
      ...d,
      portfolios: d.portfolios.map((v) => (v.id === id ? { ...v, ...change } : v)),
    }));
  const move = (index: number, direction: number) => {
    const list = [...p.experienceIds];
    [list[index], list[index + direction]] = [list[index + direction], list[index]];
    patch({ experienceIds: list });
  };
  const copy = async () => {
    setCopying(true);
    try {
      await navigator.clipboard.writeText(window.location.origin + "/portfolio/" + id);
      toast("이 브라우저에서 열 수 있는 미리보기 링크를 복사했습니다.");
    } catch {
      toast("복사하지 못했습니다. 아래 링크를 직접 복사해 주세요.");
    } finally {
      setCopying(false);
    }
  };
  return (
    <>
      <Link href="/portfolio" className="back-link">
        <ArrowLeft size={16} />
        나의 포트폴리오
      </Link>
      <PageHeading
        eyebrow="PORTFOLIO STUDIO"
        title={p.title}
        description="나의 경험을 선택하고, 순서를 다듬고, 완성된 이야기를 확인하세요."
        action={
          <div className="heading-actions">
            <Button variant="outline" onClick={() => setEdit(!edit)}>
              <Pencil size={15} />
              {edit ? "편집 완료" : "구성 편집"}
            </Button>
            <Button onClick={() => setShare(true)}>
              <Share2 size={15} />
              미리보기 링크
            </Button>
          </div>
        }
      />
      <div className="preview-toolbar">
        <div>
          <Badge>
            <LockKeyhole size={12} />
            비공개 초안
          </Badge>
          <span>
            <ShieldCheck size={14} />
            확인한 경험과 근거를 바탕으로 구성
          </span>
        </div>
        <div className="preview-device">
          <button
            aria-pressed={device === "desktop"}
            className={device === "desktop" ? "active" : ""}
            onClick={() => setDevice("desktop")}
          >
            Desktop
          </button>
          <button
            aria-pressed={device === "mobile"}
            className={device === "mobile" ? "active" : ""}
            onClick={() => setDevice("mobile")}
          >
            Mobile
          </button>
        </div>
      </div>
      {edit && (
        <div className="portfolio-editor panel">
          <div>
            <h2>포트폴리오 구성</h2>
            <p className="muted">
              포함할 경험을 추가·삭제하거나 순서를 바꾸세요. 변경 내용은 바로 저장됩니다.
            </p>
          </div>
          <label>
            포트폴리오 제목
            <input
              value={p.title}
              maxLength={150}
              onChange={(e) => patch({ title: e.target.value })}
            />
          </label>
          <div className="editor-projects">
            {experiences.map((e, index) => (
              <div key={e.id}>
                <span className="editor-index">{index + 1}</span>
                <ProjectIcon experience={e} small />
                <span className="editor-project-title">{e.title}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={e.title + " 위로 이동"}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  <ArrowUp size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={e.title + " 아래로 이동"}
                  disabled={index === experiences.length - 1}
                  onClick={() => move(index, 1)}
                >
                  <ArrowDown size={15} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label={e.title + " 제외"}
                  onClick={() =>
                    patch({ experienceIds: p.experienceIds.filter((v) => v !== e.id) })
                  }
                >
                  <X size={16} />
                </Button>
              </div>
            ))}
          </div>
          <div className="editor-add">
            <select
              value={addId}
              onChange={(e) => setAddId(e.target.value)}
              aria-label="추가할 경험"
            >
              <option value="">추가할 경험 선택</option>
              {data.experiences
                .filter((e) => e.status === "approved" && !p.experienceIds.includes(e.id))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.title}
                  </option>
                ))}
            </select>
            <Button
              variant="outline"
              disabled={!addId}
              onClick={() => {
                patch({ experienceIds: [...p.experienceIds, addId] });
                setAddId("");
              }}
            >
              <Plus size={15} />
              경험 추가
            </Button>
          </div>
        </div>
      )}
      <div className={"portfolio-preview-frame " + (device === "mobile" ? "mobile-preview" : "")}>
        <div className="portfolio-preview">
          <header className="portfolio-public-nav">
            <strong>
              {data.profile.name}
              <span>.</span>
            </strong>
            <nav>
              <a href="#portfolio-about">About</a>
              <a href="#portfolio-projects">Projects</a>
              <a href="#portfolio-contact">Contact</a>
            </nav>
          </header>
          <section className="portfolio-profile">
            <div className="portfolio-eyebrow">{job?.position || "MY EXPERIENCE PORTFOLIO"}</div>
            <h1>
              안녕하세요.
              <br />
              <span>{data.profile.headline || "경험으로 나를 소개합니다."}</span>
              <br />
              {data.profile.name}입니다.
            </h1>
            <p>
              {job
                ? job.company + " 지원을 위해 선별한 경험을 소개합니다."
                : "지금까지 쌓아온 경험과 그 안에서 발견한 강점을 소개합니다."}
            </p>
            <div className="profile-portfolio-tags">
              <span>
                <Layers3 size={14} />
                {experiences.length} Selected Experiences
              </span>
              <span>
                <ShieldCheck size={14} />
                Evidence-based Portfolio
              </span>
            </div>
            <div className="portfolio-hero-number">
              01—{String(experiences.length).padStart(2, "0")}
            </div>
          </section>
          <section className="portfolio-about" id="portfolio-about">
            <span className="portfolio-section-label">01 / ABOUT ME</span>
            <h2>
              경험에서 배우고,
              <br />
              배운 것을 다음 문제에 연결합니다.
            </h2>
            <p>{data.profile.about || "프로필에서 자기소개를 작성하면 여기에 표시됩니다."}</p>
            <h3>Core Skills</h3>
            <div className="tag-row">
              {skills.map((s) => (
                <Badge key={s}>{s}</Badge>
              ))}
            </div>
          </section>
          <section className="portfolio-selected" id="portfolio-projects">
            <span className="portfolio-section-label">02 / SELECTED EXPERIENCES</span>
            <h2>나를 보여주는 경험</h2>
            <p>무엇을 고민하고, 어떤 일을 했는지. 그 과정과 근거를 담았습니다.</p>
            {experiences.map((e, index) => (
              <article className="portfolio-project-detail" key={e.id}>
                <div className="portfolio-project-top">
                  <span className="portfolio-project-number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ProjectIcon experience={e} />
                  <div>
                    <Badge>{e.type}</Badge>
                    <h3>{e.title}</h3>
                    <p>{e.description}</p>
                  </div>
                </div>
                <div className="portfolio-project-meta">
                  <div>
                    <span>PERIOD</span>
                    <strong>{period(e.startDate, e.endDate)}</strong>
                  </div>
                  <div>
                    <span>MY ROLE</span>
                    <strong>{e.role}</strong>
                  </div>
                  <div>
                    <span>TECH STACK</span>
                    <strong>{e.skills.join(" · ")}</strong>
                  </div>
                </div>
                <div className="portfolio-claims">
                  {e.claims
                    .filter((c) => c.status !== "needs_review" && c.content !== "사용자 확인 필요")
                    .map((c) => (
                      <div key={c.section}>
                        <h4>{sections.find((s) => s.key === c.section)?.label}</h4>
                        <p>{c.content}</p>
                        <small>
                          <ShieldCheck size={12} />
                          {c.status === "source_verified"
                            ? e.isDemo
                              ? "예시 원본 근거 연결"
                              : "원본 근거 연결"
                            : "사용자 확인 근거"}{" "}
                          ·{" "}
                          {c.evidenceIds
                            .map((id) => e.evidence.find((v) => v.id === id)?.source)
                            .filter(Boolean)
                            .join(", ")}
                        </small>
                      </div>
                    ))}
                </div>
                {e.claims.some((c) => c.status === "needs_review") && (
                  <HelpNote>확인이 필요한 내용은 포트폴리오 본문에서 제외했습니다.</HelpNote>
                )}
                <div className="portfolio-project-evidence">
                  <h4>
                    <ShieldCheck size={17} />
                    Evidence
                  </h4>
                  {e.isDemo && <p className="muted">제품 흐름을 보여주는 예시 자료입니다.</p>}
                  <EvidenceList
                    items={e.evidence.filter((v) => v.status !== "needs_review")}
                    isDemo={e.isDemo}
                  />
                </div>
              </article>
            ))}
            {!experiences.length && (
              <Empty
                icon={<Layers3 size={25} />}
                title="보여줄 경험을 선택해주세요."
                description="구성 편집에서 포트폴리오에 담을 경험을 추가하세요."
              />
            )}
          </section>
          <section className="portfolio-contact" id="portfolio-contact">
            <span className="portfolio-section-label">03 / LET’S CONNECT</span>
            <h2>다음 기회에서 만나요.</h2>
            {data.profile.email && (
              <a href={"mailto:" + data.profile.email}>
                <Mail size={18} />
                {data.profile.email}
                <ArrowUpRight size={16} />
              </a>
            )}
          </section>
          <footer className="portfolio-public-footer">
            <span>{data.profile.name} · Portfolio</span>
            <span>
              Made with <strong>folio.</strong>
            </span>
          </footer>
        </div>
      </div>
      <Dialog open={share} onOpenChange={setShare}>
        <DialogContent>
          <DialogTitle className="dialog-title">포트폴리오 미리보기 링크</DialogTitle>
          <DialogDescription className="muted">
            현재 링크는 같은 브라우저에 저장된 포트폴리오를 여는 용도입니다. 다른 사람에게 공개되는
            웹 공유는 서버 연결 후 제공됩니다.
          </DialogDescription>
          <div className="share-preview-card">
            <PanelsTopLeft size={28} />
            <strong>{p.title}</strong>
            <Badge>
              <LockKeyhole size={12} />
              비공개 초안
            </Badge>
          </div>
          <label>
            미리보기 링크
            <input
              readOnly
              value={
                typeof window !== "undefined" ? window.location.origin + "/portfolio/" + id : ""
              }
              onFocus={(e) => e.target.select()}
            />
          </label>
          <Button className="full-width" onClick={copy} disabled={copying}>
            <Share2 size={16} />
            {copying ? "복사 중…" : "미리보기 링크 복사"}
          </Button>
          <HelpNote>자료의 원본과 개인 정보는 자동으로 공개하지 않습니다.</HelpNote>
        </DialogContent>
      </Dialog>
    </>
  );
}
