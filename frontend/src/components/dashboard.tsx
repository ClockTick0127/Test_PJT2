"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  BriefcaseBusiness,
  ChevronRight,
  FilePlus2,
  FileText,
  FolderOpen,
  PenLine,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { rankExperiences } from "@/lib/mock-analysis";
import { Button } from "./ui/button";
import { Empty } from "./ui/primitives";
import { PageHeading, SectionHeading, JobLogo } from "./shared";
import { DocumentList } from "./document-list";

export function Dashboard() {
  const { data } = useStore();
  const { experiences, jobs, portfolios, profile } = data;
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("all");
  const approved = experiences.filter((experience) => experience.status === "approved").length;
  const drafts = experiences.length - approved;
  const evidenceCount = experiences.reduce(
    (sum, experience) => sum + experience.evidence.length,
    0,
  );
  const documents = experiences.filter(
    (experience) =>
      (tab === "all" || experience.status === tab) &&
      (experience.title + " " + experience.role + " " + experience.skills.join(" "))
        .toLowerCase()
        .includes(query.toLowerCase()),
  );
  const topJob = jobs[0];
  const bestMatch = topJob ? rankExperiences(experiences, topJob)[0] : undefined;
  const stats = [
    { label: "경험 문서", value: experiences.length, href: "/experience" },
    { label: "정리 완료", value: approved, href: "/experience" },
    { label: "채용공고 노트", value: jobs.length, href: "/jobs" },
    { label: "포트폴리오", value: portfolios.length, href: "/portfolio" },
  ];

  return (
    <>
      <PageHeading
        eyebrow="MY WORKSPACE"
        title="나의 문서 작업실"
        description={profile.name + "님, 오늘의 경험을 기록하고 다음 이야기를 준비해보세요."}
        action={
          <span className="workspace-heading-note">
            <ShieldCheck size={15} />
            근거와 함께 쌓이는 기록
          </span>
        }
      />
      <div className="writing-start-grid">
        <Link href="/experience/new" className="writing-start">
          <span className="writing-illustration">
            <FilePlus2 size={43} strokeWidth={1} />
            <i />
            <i />
          </span>
          <div>
            <span className="writing-kicker">START WRITING</span>
            <h2>새로운 경험 기록하기</h2>
            <p>작은 메모도 좋은 문서의 시작이 됩니다.</p>
            <span className="writing-action">
              빈 문서에서 시작
              <ArrowUpRight size={14} />
            </span>
          </div>
        </Link>
        <Link href="/jobs" className="writing-start secondary">
          <span className="writing-illustration">
            <BookOpen size={43} strokeWidth={1} />
            <Search size={19} />
          </span>
          <div>
            <span className="writing-kicker">FIND YOUR STORY</span>
            <h2>공고에 맞는 경험 찾기</h2>
            <p>기록해둔 경험을 다음 기회와 연결하세요.</p>
            <span className="writing-action">
              채용공고 노트 열기
              <ArrowUpRight size={14} />
            </span>
          </div>
        </Link>
      </div>
      <div className="workspace-summary">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <span>{stat.label}</span>
            <strong>
              {stat.value}
              <small>개</small>
            </strong>
            <ChevronRight size={13} />
          </Link>
        ))}
      </div>
      <div className="document-home-columns">
        <section className="document-home-main">
          <SectionHeading title="최근 경험 문서" link="문서함 열기" href="/experience" />
          <div className="document-home-toolbar">
            <div className="document-tabs" role="group" aria-label="최근 문서 상태">
              {[
                { value: "all", label: "전체 문서", count: experiences.length },
                { value: "approved", label: "정리 완료", count: approved },
                { value: "review", label: "초안", count: drafts },
              ].map((item) => (
                <button
                  key={item.value}
                  aria-pressed={tab === item.value}
                  className={tab === item.value ? "active" : ""}
                  onClick={() => setTab(item.value)}
                >
                  {item.label}
                  <span>{item.count}</span>
                </button>
              ))}
            </div>
            <div className="search-field document-home-search">
              <Search size={15} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="기록에서 찾기…"
                aria-label="최근 경험 문서 검색"
              />
            </div>
          </div>
          {documents.length ? (
            <DocumentList items={documents.slice(0, 6)} compact />
          ) : (
            <Empty
              icon={<FileText size={27} />}
              title={
                experiences.length ? "조건에 맞는 문서가 없어요." : "아직 기록된 경험이 없습니다."
              }
              description={
                experiences.length
                  ? "다른 검색어나 문서 상태로 찾아보세요."
                  : "첫 문서를 열고 기억나는 경험부터 짧게 적어보세요."
              }
            >
              {experiences.length ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery("");
                    setTab("all");
                  }}
                >
                  전체 문서 보기
                </Button>
              ) : (
                <Button asChild>
                  <Link href="/experience/new">
                    <PenLine size={15} />첫 경험 기록하기
                  </Link>
                </Button>
              )}
            </Empty>
          )}
          <Link href="/experience/new" className="document-add-row">
            <PlusIcon />새 경험 문서 작성하기
          </Link>
          <div className="document-trust-line">
            <ShieldCheck size={14} />
            <span>기록한 사실만 정리합니다. 확인이 필요한 내용은 따로 표시해요.</span>
          </div>
          <section className="home-job-notes">
            <SectionHeading title="최근 채용공고 노트" link="전체 노트" href="/jobs" />
            {jobs.slice(0, 2).map((job) => (
              <Link href={"/jobs/" + job.id} className="home-job-note" key={job.id}>
                <JobLogo company={job.company} />
                <span>
                  <strong>{job.company}</strong>
                  <small>{job.position}</small>
                </span>
                <span className="home-note-meta">{job.skills.length}개 요구 역량</span>
                <ChevronRight size={15} />
              </Link>
            ))}
            {!jobs.length && (
              <Link href="/jobs/new" className="document-add-row">
                <BriefcaseBusiness size={17} />
                관심 있는 공고를 첫 노트로 남기세요
                <ArrowUpRight size={14} />
              </Link>
            )}
          </section>
        </section>
        <aside className="document-home-aside">
          <div className="notebook-note">
            <span className="note-kicker">A NOTE TO SELF</span>
            <PenLine size={18} />
            <h3>
              기억은 흐려져도,
              <br />
              기록은 남으니까.
            </h3>
            <p>오늘 해결한 문제와 내가 맡았던 역할. 작은 것부터 차근차근 적어두세요.</p>
            <Link href="/experience/new">
              오늘의 경험 남기기
              <ArrowUpRight size={14} />
            </Link>
          </div>
          <section className="workspace-index">
            <h3>나의 문서함</h3>
            <Link href="/experience">
              <FolderOpen size={16} />
              <span>경험 기록</span>
              <small>{experiences.length}</small>
            </Link>
            <Link href="/jobs">
              <BriefcaseBusiness size={16} />
              <span>공고 노트</span>
              <small>{jobs.length}</small>
            </Link>
            <Link href="/portfolio">
              <BookOpen size={16} />
              <span>포트폴리오</span>
              <small>{portfolios.length}</small>
            </Link>
            <div className="index-evidence">
              <ShieldCheck size={15} />
              {evidenceCount}개의 근거 자료가 연결되어 있어요.
            </div>
          </section>
          {topJob && bestMatch && (
            <section className="workspace-match-note">
              <div className="note-kicker">CONNECTED STORIES</div>
              <h3>{topJob.company}에 어울리는 기록</h3>
              <p>{bestMatch.experience.title}</p>
              <span>
                <strong>{bestMatch.score}%</strong> 요구 역량 연결
              </span>
              <Link href={"/jobs/" + topJob.id + "/match"}>
                근거와 매칭 이유 읽기
                <ArrowUpRight size={14} />
              </Link>
              <small>요구 역량의 가중 커버리지 · 예시 공고</small>
            </section>
          )}
        </aside>
      </div>
    </>
  );
}

function PlusIcon() {
  return <FilePlus2 size={17} strokeWidth={1.5} />;
}
