"use client";
import { useParams } from "next/navigation";
import { AppShell } from "./app-shell";
import { Dashboard } from "./dashboard";
import { Login } from "./login";
import { ExperienceLibrary, NewExperience, ExperienceDetail, AnalysisScreen } from "./experiences";
import { JobLibrary, NewJob, JobDetail, JobMatch } from "./jobs";
import { PortfolioLibrary, PortfolioPreview } from "./portfolios";
import { ProfileScreen, SettingsScreen } from "./profile";
import { Empty } from "./ui/primitives";
import { Button } from "./ui/button";
import { Layers3 } from "lucide-react";
import Link from "next/link";
export function AppRouter() {
  const params = useParams<{ path: string[] }>();
  const path = params.path || [];
  const [section, id, action] = path;
  let content: React.ReactNode;
  if (section === "login" && path.length === 1) return <Login />;
  if (section === "dashboard" && path.length === 1) content = <Dashboard />;
  else if (section === "experience" && path.length === 1) content = <ExperienceLibrary />;
  else if (section === "experience" && id === "new" && path.length === 2)
    content = <NewExperience />;
  else if (section === "experience" && id && action === "analyze" && path.length === 3)
    content = <AnalysisScreen key={id} id={id} />;
  else if (section === "experience" && id && path.length === 2)
    content = <ExperienceDetail key={id} id={id} />;
  else if (section === "jobs" && path.length === 1) content = <JobLibrary />;
  else if (section === "jobs" && id === "new" && path.length === 2) content = <NewJob />;
  else if (section === "jobs" && id && action === "match" && path.length === 3)
    content = <JobMatch key={id} id={id} />;
  else if (section === "jobs" && id && path.length === 2) content = <JobDetail key={id} id={id} />;
  else if (section === "portfolio" && path.length === 1) content = <PortfolioLibrary />;
  else if (section === "portfolio" && id && path.length === 2)
    content = <PortfolioPreview key={id} id={id} />;
  else if (section === "profile" && path.length === 1) content = <ProfileScreen />;
  else if (section === "settings" && path.length === 1) content = <SettingsScreen />;
  else
    content = (
      <Empty
        icon={<Layers3 size={28} />}
        title="페이지를 찾을 수 없습니다."
        description="주소를 확인하거나 대시보드로 이동해 주세요."
      >
        <Button asChild>
          <Link href="/dashboard">대시보드로 이동</Link>
        </Button>
      </Empty>
    );
  return <AppShell>{content}</AppShell>;
}
