"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Layers3,
  ShieldCheck,
  Sparkles,
  BriefcaseBusiness,
  PanelsTopLeft,
  Check,
  Plus,
  ArrowUpRight,
  FileText,
  GitBranch,
  Code2,
  HeartPulse,
  Target,
} from "lucide-react";
import { Brand } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { useStore } from "@/lib/store";
const steps = [
  {
    icon: Layers3,
    title: "경험을 모으세요",
    copy: "프로젝트부터 작은 활동까지, 내 경험을 한곳에.",
  },
  {
    icon: Sparkles,
    title: "강점을 발견하세요",
    copy: "문제, 역할, 행동, 결과로 경험을 명확하게 정리.",
  },
  {
    icon: BriefcaseBusiness,
    title: "공고를 이해하세요",
    copy: "지원하는 직무에 필요한 기술과 역량을 확인.",
  },
  { icon: Target, title: "기회와 연결하세요", copy: "어떤 경험이 적합한지, 그 이유와 근거까지." },
  {
    icon: PanelsTopLeft,
    title: "나답게 소개하세요",
    copy: "선택한 경험으로 기업에 맞는 포트폴리오 완성.",
  },
];
export default function Landing() {
  const router = useRouter();
  const { startDemo } = useStore();
  const demo = () => {
    startDemo();
    router.push("/dashboard");
  };
  return (
    <div className="landing">
      <header className="landing-nav">
        <Brand />
        <nav>
          <a href="#how-it-works">이용 방법</a>
          <a href="#evidence">왜 folio인가요?</a>
        </nav>
        <div>
          <Link href="/login" className="landing-login">
            로그인
          </Link>
          <Button asChild size="sm">
            <Link href="/login?mode=signup">
              무료로 시작하기
              <ArrowUpRight size={14} />
            </Link>
          </Button>
        </div>
      </header>
      <main>
        <section className="landing-hero">
          <div className="landing-hero-copy">
            <div className="landing-kicker">
              <span />
              나의 경험이, 다음 기회로
            </div>
            <h1>
              당신의 경험을 기록하면,
              <br />
              <em>
                필요한 순간에
                <br />
                꺼내드립니다.
              </em>
            </h1>
            <p>
              흩어진 프로젝트와 활동 기록을 한곳에.
              <br />내 경험의 강점을 발견하고, 지원하는 기업에
              <br className="desktop-break" /> 가장 적합한 포트폴리오를 만들어보세요.
            </p>
            <div className="hero-actions">
              <Button asChild size="lg">
                <Link href="/login?mode=signup">
                  무료로 시작하기
                  <ArrowUpRight size={17} />
                </Link>
              </Button>
              <Button variant="outline" size="lg" onClick={demo}>
                데모 둘러보기
              </Button>
            </div>
            <div className="hero-promise">
              <ShieldCheck size={15} />
              <span>실제 경험과 근거를 바탕으로, 과장 없이.</span>
            </div>
          </div>
          <div className="landing-visual">
            <div className="visual-grid" />
            <div className="floating-evidence">
              <ShieldCheck size={18} />
              <div>
                <strong>Evidence connected</strong>
                <span>모든 이야기는 실제 경험에서</span>
              </div>
              <Check size={15} />
            </div>
            <div className="landing-mini-app">
              <div className="mini-app-bar">
                <span className="mini-traffic">
                  <i />
                  <i />
                  <i />
                </span>
                <span>My Experience Library</span>
                <Layers3 size={14} />
              </div>
              <div className="mini-app-content">
                <div className="mini-label">MY EXPERIENCE</div>
                <h3>
                  경험이 쌓이는 곳,
                  <br />
                  가능성이 시작되는 곳.
                </h3>
                <div className="mini-project">
                  <div className="project-icon tone-blue">
                    <Code2 size={23} />
                  </div>
                  <div>
                    <strong>함께 만드는 웹 게임, Playground</strong>
                    <span>Frontend Developer</span>
                  </div>
                  <Badge tone="green">분석 완료</Badge>
                </div>
                <div className="mini-tags">
                  <Badge>React</Badge>
                  <Badge>JavaScript</Badge>
                  <Badge>API Integration</Badge>
                </div>
                <div className="mini-divider" />
                <div className="mini-analysis">
                  <span>
                    <Check size={13} />
                    Problem
                  </span>
                  <span>
                    <Check size={13} />
                    Action
                  </span>
                  <span>
                    <Check size={13} />
                    Result
                  </span>
                </div>
                <div className="mini-evidence">
                  <GitBranch size={15} />
                  구현 코드
                  <FileText size={15} />
                  프로젝트 발표자료
                  <ShieldCheck size={14} />
                </div>
                <div className="mini-project secondary">
                  <div className="project-icon tone-mint">
                    <HeartPulse size={22} />
                  </div>
                  <div>
                    <strong>내 건강에 맞춘 한 끼, Glucare</strong>
                    <span>Frontend · AI Service</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="floating-match">
              <span className="match-logo">t</span>
              <div>
                <span>Frontend Developer</span>
                <strong>내 경험과 연결된 기회</strong>
              </div>
              <div className="match-number">
                81<small>%</small>
              </div>
            </div>
            <div className="visual-caption">예시 경험을 담은 folio 데모</div>
          </div>
        </section>
        <section className="landing-strip">
          <span>YOUR EXPERIENCE, YOUR NEXT OPPORTUNITY</span>
          <div>
            <strong>Experience</strong>
            <i>→</i>
            <strong>Evidence</strong>
            <i>→</i>
            <strong>Job Matching</strong>
            <i>→</i>
            <strong>Portfolio</strong>
          </div>
        </section>
        <section className="landing-process" id="how-it-works">
          <div className="eyebrow">HOW IT WORKS</div>
          <h2>
            경험을 넣는 것부터,
            <br />
            다음 기회를 준비하는 것까지.
          </h2>
          <p>한 번 정리한 경험은, 매번 새롭게 활용하세요.</p>
          <div className="process-grid">
            {steps.map(({ icon: Icon, title, copy }, i) => (
              <div key={title}>
                <div className="process-number">0{i + 1}</div>
                <span className="process-icon">
                  <Icon size={23} strokeWidth={1.6} />
                </span>
                <h3>{title}</h3>
                <p>{copy}</p>
              </div>
            ))}
          </div>
        </section>
        <section className="landing-evidence" id="evidence">
          <div>
            <Badge tone="blue">
              <ShieldCheck size={14} />
              EVIDENCE FIRST
            </Badge>
            <h2>
              잘 쓴 문장보다,
              <br />
              믿을 수 있는 내 이야기.
            </h2>
            <p>
              내가 하지 않은 일, 확인할 수 없는 성과는 넣지 않아요.
              <br />각 경험을 원본 자료와 연결하고,
              <br />
              불확실한 내용은 직접 확인할 수 있도록 남겨둡니다.
            </p>
            <div className="evidence-promises">
              <span>
                <Check size={16} />
                출처가 연결된 경험
              </span>
              <span>
                <Check size={16} />
                설명 가능한 매칭
              </span>
              <span>
                <Check size={16} />
                사용자의 최종 확인
              </span>
            </div>
          </div>
          <div className="evidence-example">
            <div className="mini-label">MY ACTION</div>
            <h3>React 기반 추천 결과 페이지 구현</h3>
            <div className="evidence-connector" />
            <div className="evidence-example-source">
              <GitBranch size={22} />
              <div>
                <strong>구현 코드</strong>
                <span>src/pages/recommendation.tsx</span>
              </div>
              <Badge tone="green">
                <ShieldCheck size={12} />
                예시 근거
              </Badge>
            </div>
            <div className="unverified-example">
              <span>사용자 만족도 향상</span>
              <Badge tone="amber">사용자 확인 필요</Badge>
            </div>
            <p>확인되지 않은 수치는 임의로 생성하지 않습니다.</p>
          </div>
        </section>
        <section className="landing-final">
          <span className="brand-mark">
            <span />
            <span />
            <span />
          </span>
          <h2>
            당신의 다음 기회는,
            <br />
            이미 쌓아온 경험에서 시작됩니다.
          </h2>
          <Button asChild size="lg">
            <Link href="/login?mode=signup">
              나의 경험 기록하기
              <Plus size={17} />
            </Link>
          </Button>
        </section>
      </main>
      <footer className="landing-footer">
        <Brand />
        <span>© 2026 folio. Experience meets opportunity.</span>
        <span>브라우저에 저장되는 프로토타입</span>
      </footer>
    </div>
  );
}
