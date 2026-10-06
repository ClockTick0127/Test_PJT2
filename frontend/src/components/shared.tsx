"use client";
import Link from "next/link";
import {
  ArrowUpRight,
  Code2,
  HeartPulse,
  BrainCircuit,
  PenTool,
  BriefcaseBusiness,
  Users,
  FileText,
  GitBranch,
  ShieldCheck,
  Search,
  Plus,
  Check,
  CircleHelp,
  ExternalLink,
} from "lucide-react";
import type { Experience, Evidence, Job } from "@folio/shared";
import { completeness, matchExperience } from "@/lib/mock-analysis";
import { period } from "@/lib/utils";
import { Badge, Progress, Empty } from "./ui/primitives";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { useState } from "react";
export const projectIcons = {
  code: Code2,
  heart: HeartPulse,
  brain: BrainCircuit,
  design: PenTool,
  briefcase: BriefcaseBusiness,
  users: Users,
};
export function ProjectIcon({
  experience,
  small = false,
}: {
  experience: Experience;
  small?: boolean;
}) {
  const Icon = projectIcons[experience.icon] || Code2;
  return (
    <div className={"project-icon tone-" + experience.color + (small ? " small" : "")}>
      <Icon size={small ? 19 : 25} strokeWidth={1.65} />
    </div>
  );
}
export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}
export function SectionHeading({
  title,
  description,
  link,
  href,
}: {
  title: string;
  description?: string;
  link?: string;
  href?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {description && <p>{description}</p>}
      </div>
      {link && href && (
        <Link href={href} className="subtle-link">
          {link}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
export function ExperienceCard({ experience }: { experience: Experience }) {
  const value = completeness(experience);
  return (
    <Link className="experience-card" href={"/experience/" + experience.id}>
      <div className="experience-card-top">
        <ProjectIcon experience={experience} />
        <div className="card-type">
          <Badge>{experience.type}</Badge>
          <ArrowUpRight size={17} />
        </div>
      </div>
      <h3>{experience.title}</h3>
      <p className="role">{experience.role}</p>
      <p className="card-period">{period(experience.startDate, experience.endDate)}</p>
      <div className="tag-row">
        {experience.skills.slice(0, 3).map((s) => (
          <Badge key={s}>{s}</Badge>
        ))}
        {experience.skills.length > 3 && <Badge>+{experience.skills.length - 3}</Badge>}
      </div>
      <div className="card-evidence">
        <span>
          <ShieldCheck size={15} />
          {experience.evidence.length}개의 근거
        </span>
        <span className={experience.status === "approved" ? "status-approved" : "status-review"}>
          {experience.status === "approved" ? "분석 완료" : "검토 필요"}
        </span>
      </div>
      <div className="card-completeness">
        <span>경험 완성도</span>
        <strong>{value}%</strong>
      </div>
      <Progress value={value} />
    </Link>
  );
}
export function AddExperienceCard() {
  return (
    <Link href="/experience/new" className="add-experience-card">
      <div>
        <Plus size={23} />
      </div>
      <strong>새로운 경험을 남겨보세요</strong>
      <p>작은 경험도 나만의 강점이 됩니다.</p>
      <span>경험 추가하기</span>
    </Link>
  );
}
export function EvidenceList({ items, isDemo = false }: { items: Evidence[]; isDemo?: boolean }) {
  const [selected, setSelected] = useState<Evidence | null>(null);
  return (
    <>
      <div className="evidence-list">
        {items.map((e) => (
          <button type="button" className="evidence-row" key={e.id} onClick={() => setSelected(e)}>
            <span className="source-icon">
              {e.type === "github" ? <GitBranch size={19} /> : <FileText size={19} />}
            </span>
            <span>
              <strong>{e.source}</strong>
              <small>{e.reference}</small>
            </span>
            <Badge
              tone={
                e.status === "source_verified"
                  ? "green"
                  : e.status === "user_confirmed"
                    ? "blue"
                    : "amber"
              }
            >
              {e.status === "source_verified"
                ? isDemo
                  ? "예시 근거"
                  : "원본 확인"
                : e.status === "user_confirmed"
                  ? "사용자 입력"
                  : "확인 필요"}
            </Badge>
            <ArrowUpRight size={16} />
          </button>
        ))}
      </div>
      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          <DialogTitle className="dialog-title">{selected?.source}</DialogTitle>
          <DialogDescription className="muted">
            {selected?.reference}
            {isDemo ? " · 실제 자료가 아닌 데모 발췌입니다." : ""}
          </DialogDescription>
          <div className="evidence-content">{selected?.content}</div>
          {selected?.url && (
            <a
              href={selected.url}
              target="_blank"
              rel="noopener noreferrer"
              className="button button-outline"
            >
              <ExternalLink size={16} />
              첨부한 URL 열기
            </a>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
export function JobLogo({ company }: { company: string }) {
  return (
    <div
      className={
        "job-logo " +
        (company === "토스"
          ? "logo-toss"
          : company === "네이버"
            ? "logo-naver"
            : company === "당근"
              ? "logo-carrot"
              : "logo-generic")
      }
    >
      {company === "토스"
        ? "t"
        : company === "네이버"
          ? "N"
          : company === "당근"
            ? "d"
            : company.slice(0, 1)}
    </div>
  );
}
export function JobRow({ job, experiences }: { job: Job; experiences: Experience[] }) {
  const scores = experiences.map((e) => matchExperience(e, job).score);
  const highest = Math.max(0, ...scores);
  return (
    <Link className="job-row" href={"/jobs/" + job.id}>
      <JobLogo company={job.company} />
      <div className="job-row-info">
        <strong>{job.company}</strong>
        <span>{job.position}</span>
      </div>
      <div className="job-match">
        <strong>{highest}%</strong>
        <span>최고 적합도</span>
      </div>
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function NothingFound({
  title = "검색 결과가 없습니다.",
  description = "검색어나 필터를 바꿔보세요.",
}: {
  title?: string;
  description?: string;
}) {
  return <Empty icon={<Search size={25} />} title={title} description={description} />;
}
export function VerificationNote() {
  return (
    <div className="verification-note">
      <ShieldCheck size={18} />
      <p>
        내가 한 일만, 근거와 함께.<span>확인되지 않은 경험이나 성과는 만들어내지 않습니다.</span>
      </p>
    </div>
  );
}
export function ScoreRing({ score, size = 76 }: { score: number; size?: number }) {
  return (
    <div
      className="score-ring"
      style={{
        width: size,
        height: size,
        background: "conic-gradient(var(--primary) " + score + "%, #eceefa 0)",
      }}
    >
      <div>
        <strong>
          {score}
          <small>%</small>
        </strong>
      </div>
    </div>
  );
}
export function Confirmed({ children }: { children: React.ReactNode }) {
  return (
    <span className="confirmed-label">
      <Check size={14} />
      {children}
    </span>
  );
}
export function HelpNote({ children }: { children: React.ReactNode }) {
  return (
    <div className="help-note">
      <CircleHelp size={16} />
      <span>{children}</span>
    </div>
  );
}
