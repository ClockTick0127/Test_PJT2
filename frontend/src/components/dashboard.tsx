"use client";
import Link from "next/link";
import {
  Plus,
  Layers3,
  Sparkles,
  BriefcaseBusiness,
  PanelsTopLeft,
  ArrowUpRight,
  Check,
  Target,
  ShieldCheck,
  BookOpen,
  ChevronRight,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { rankExperiences } from "@/lib/mock-analysis";
import { Button } from "./ui/button";
import { Badge, Empty } from "./ui/primitives";
import {
  PageHeading,
  SectionHeading,
  ExperienceCard,
  AddExperienceCard,
  JobRow,
  JobLogo,
  ScoreRing,
} from "./shared";
export function Dashboard() {
  const { data } = useStore();
  const { experiences, jobs, portfolios, profile } = data;
  const approved = experiences.filter((e) => e.status === "approved").length;
  const stats = [
    {
      label: "등록한 경험",
      value: experiences.length,
      unit: "개",
      icon: Layers3,
      tone: "blue",
      note: "나를 만드는 경험의 기록",
      href: "/experience",
    },
    {
      label: "분석 완료",
      value: approved,
      unit: "개",
      icon: Sparkles,
      tone: "violet",
      note: "내 강점이 정리되어 있어요",
      href: "/experience",
    },
    {
      label: "지원 공고",
      value: jobs.length,
      unit: "개",
      icon: BriefcaseBusiness,
      tone: "mint",
      note: "다음 기회를 살펴보세요",
      href: "/jobs",
    },
    {
      label: "생성한 포트폴리오",
      value: portfolios.length,
      unit: "개",
      icon: PanelsTopLeft,
      tone: "peach",
      note: "경험을 나만의 이야기로",
      href: "/portfolio",
    },
  ];
  const topJob = jobs[0];
  const ranked = topJob ? rankExperiences(experiences, topJob) : [];
  const counts = experiences.reduce<Record<string, number>>((acc, e) => {
    e.skills.forEach((s) => (acc[s] = (acc[s] || 0) + 1));
    return acc;
  }, {});
  const topSkills = Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  return (
    <>
      <PageHeading
        eyebrow="YOUR CAREER WORKSPACE"
        title={"안녕하세요, " + profile.name + "님 👋"}
        description={
          experiences.length
            ? "지금까지 " +
              experiences.length +
              "개의 경험이 모였어요. 다음 기회를 함께 준비해볼까요?"
            : "첫 번째 경험을 남기고 나만의 커리어 여정을 시작해보세요."
        }
        action={
          <Button asChild>
            <Link href="/experience/new">
              <Plus size={17} />
              경험 추가
            </Link>
          </Button>
        }
      />
      <div className="career-banner">
        <div className="banner-copy">
          <Badge tone="blue">
            <Sparkles size={12} />
            YOUR NEXT CHAPTER
          </Badge>
          <h2>
            기록한 경험이,
            <br className="mobile-break" /> 다음 기회의 시작.
          </h2>
          <p>흩어진 경험을 모으고, 나에게 맞는 기회와 연결하세요.</p>
          <Link href="/jobs">
            내 경험에 맞는 공고 찾기
            <ArrowUpRight size={15} />
          </Link>
        </div>
        <div className="banner-flow" aria-label="경험에서 포트폴리오로 이어지는 흐름">
          <div>
            <span>
              <Layers3 size={24} />
            </span>
            <small>Experience</small>
          </div>
          <i />
          <div>
            <span>
              <ShieldCheck size={24} />
            </span>
            <small>Evidence</small>
          </div>
          <i />
          <div>
            <span>
              <Target size={24} />
            </span>
            <small>Job fit</small>
          </div>
          <i />
          <div>
            <span>
              <PanelsTopLeft size={24} />
            </span>
            <small>Portfolio</small>
          </div>
        </div>
      </div>
      <div className="stats-grid">
        {stats.map(({ label, value, unit, icon: Icon, tone, note, href }) => (
          <Link key={label} href={href} className="stat-card">
            <div className="stat-top">
              <span className={"stat-icon tone-" + tone}>
                <Icon size={19} strokeWidth={1.7} />
              </span>
              <span>{label}</span>
              <ArrowUpRight size={15} />
            </div>
            <div className="stat-number">
              {value}
              <small>{unit}</small>
            </div>
            <p>{note}</p>
          </Link>
        ))}
      </div>
      <div className="dashboard-columns">
        <div className="dashboard-left">
          <SectionHeading
            title="최근 경험"
            description="하나씩 쌓아가는, 나만의 가능성"
            link="전체 보기"
            href="/experience"
          />
          <div className="recent-experiences">
            {experiences.slice(0, 3).map((e) => (
              <ExperienceCard key={e.id} experience={e} />
            ))}
            {!experiences.length && <AddExperienceCard />}
          </div>
          <div className="dashboard-lower">
            <section className="panel skills-panel">
              <SectionHeading title="내 경험의 핵심 기술" link="살펴보기" href="/experience" />
              <p className="muted">경험 속에서 발견한 나의 강점이에요.</p>
              {topSkills.length ? (
                <div className="skill-bars">
                  {topSkills.slice(0, 4).map(([name, count], i) => (
                    <div className="skill-bar-row" key={name}>
                      <span>{name}</span>
                      <div>
                        <i
                          style={{
                            width: (count / Math.max(...topSkills.map((s) => s[1]))) * 100 + "%",
                            opacity: 1 - i * 0.13,
                          }}
                        />
                      </div>
                      <small>{count}개 경험</small>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">경험을 등록하면 사용 기술을 모아볼 수 있어요.</p>
              )}
              <div className="panel-bottom-note">
                <ShieldCheck size={14} />
                확인한 경험을 바탕으로 정리합니다.
              </div>
            </section>
            <section className="panel jobs-panel">
              <SectionHeading title="최근 지원 공고" link="전체 보기" href="/jobs" />
              {jobs.slice(0, 3).map((j) => (
                <JobRow key={j.id} job={j} experiences={experiences} />
              ))}
              {!jobs.length && (
                <Empty
                  icon={<BriefcaseBusiness size={24} />}
                  title="다음 기회를 찾아보세요"
                  description="관심 있는 공고를 등록하면 경험을 연결해드려요."
                >
                  <Button asChild size="sm">
                    <Link href="/jobs/new">공고 등록하기</Link>
                  </Button>
                </Empty>
              )}
            </section>
          </div>
        </div>
        <aside className="dashboard-right">
          <SectionHeading title="지금, 한 걸음 더" />
          <div className="recommended-panel">
            <div className="recommended-eyebrow">
              <Target size={15} />
              추천 커리어 액션
            </div>
            {topJob && ranked[0] ? (
              <>
                <div className="recommended-company">
                  <JobLogo company={topJob.company} />
                  <div>
                    <strong>{topJob.company}</strong>
                    <span>{topJob.position}</span>
                  </div>
                </div>
                <div className="recommended-fit">
                  <ScoreRing score={ranked[0].score} size={72} />
                  <p>
                    내 경험과 잘 맞는 공고예요.
                    <strong>{ranked[0].matched.length}개 역량이 연결되어 있어요.</strong>
                  </p>
                </div>
                <div className="recommend-experience">
                  <span>가장 잘 맞는 경험</span>
                  <strong>{ranked[0].experience.title}</strong>
                  <small>
                    {ranked[0].matched
                      .slice(0, 3)
                      .map((s) => s.name)
                      .join(" · ")}
                  </small>
                </div>
                <Button asChild className="full-width">
                  <Link href={"/jobs/" + topJob.id + "/match"}>
                    경험 매칭 확인하기
                    <ArrowUpRight size={15} />
                  </Link>
                </Button>
                <small className="demo-caption">
                  예시 공고 · 점수는 요구 역량의 가중 커버리지입니다.
                </small>
              </>
            ) : (
              <>
                <h3>내 경험의 가능성을 발견하세요.</h3>
                <p className="muted">
                  경험과 관심 있는 공고를 등록하면, 어떤 경험이 적합한지 보여드려요.
                </p>
                <Button asChild className="full-width">
                  <Link href="/jobs/new">관심 공고 등록하기</Link>
                </Button>
              </>
            )}
          </div>
          <div className="checklist-panel">
            <div className="section-heading">
              <h3>커리어 준비 체크리스트</h3>
              <span>
                {
                  [
                    experiences.length > 0,
                    approved > 0,
                    jobs.length > 0,
                    portfolios.length > 0,
                  ].filter(Boolean).length
                }
                /4
              </span>
            </div>
            {[
              {
                text: "나의 첫 경험 등록하기",
                done: experiences.length > 0,
                href: "/experience/new",
              },
              {
                text: "경험 분석 확인하기",
                done: approved > 0,
                href: experiences[0] ? "/experience/" + experiences[0].id : "/experience/new",
              },
              { text: "관심 있는 공고 등록하기", done: jobs.length > 0, href: "/jobs/new" },
              { text: "맞춤 포트폴리오 만들기", done: portfolios.length > 0, href: "/portfolio" },
            ].map((item) => (
              <Link
                key={item.text}
                href={item.href}
                className={"checklist-item" + (item.done ? " done" : "")}
              >
                <span>{item.done && <Check size={12} />}</span>
                {item.text}
                <ChevronRight size={14} />
              </Link>
            ))}
          </div>
          <div className="quiet-tip">
            <BookOpen size={20} />
            <h3>완벽한 기록이 아니어도 괜찮아요.</h3>
            <p>
              무엇을 했는지 짧게 적어주세요.
              <br />
              빠진 내용은 천천히 채워가면 돼요.
            </p>
            <Link href="/experience/new">
              오늘의 경험 남기기
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
