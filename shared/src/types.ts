export type EvidenceStatus = "source_verified" | "user_confirmed" | "needs_review";
export type Section = "problem" | "role" | "action" | "result" | "learning";
export interface Evidence {
  id: string;
  type: "manual" | "pdf" | "github" | "document";
  source: string;
  content: string;
  reference: string;
  url?: string;
  status: EvidenceStatus;
  supportedSkills?: string[];
}
export interface Claim {
  section: Section;
  content: string;
  evidenceIds: string[];
  status: EvidenceStatus;
}
export interface Experience {
  id: string;
  title: string;
  type: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
  role: string;
  skills: string[];
  competencies: string[];
  evidence: Evidence[];
  claims: Claim[];
  status: "review" | "approved";
  color: string;
  icon: "code" | "heart" | "brain" | "design" | "briefcase" | "users";
  createdAt: string;
  isDemo?: boolean;
}
export interface JobSkill {
  name: string;
  importance: number;
  kind: "required" | "preferred";
}
export interface Job {
  id: string;
  company: string;
  position: string;
  description: string;
  url?: string;
  skills: JobSkill[];
  responsibilities: string[];
  createdAt: string;
  isDemo?: boolean;
}
export interface Portfolio {
  id: string;
  jobId: string;
  title: string;
  slug: string;
  experienceIds: string[];
  visibility: "private" | "link" | "public";
  createdAt: string;
}
export interface Profile {
  name: string;
  email: string;
  headline: string;
  about: string;
}
export interface AppData {
  version: 1;
  profile: Profile;
  experiences: Experience[];
  jobs: Job[];
  portfolios: Portfolio[];
  session: boolean;
}
export interface ExperienceInput {
  title: string;
  type: string;
  organization: string;
  startDate: string;
  endDate: string;
  description: string;
  role: string;
  skills: string;
  problem: string;
  action: string;
  result: string;
  learning: string;
  github: string;
  fileName: string;
}
export const sections: { key: Section; label: string; question: string }[] = [
  { key: "problem", label: "Problem", question: "어떤 문제를 해결하려고 했나요?" },
  { key: "role", label: "My Role", question: "내가 맡은 역할은 무엇인가요?" },
  { key: "action", label: "Action", question: "실제로 어떤 행동을 했나요?" },
  { key: "result", label: "Result", question: "어떤 결과를 만들었나요?" },
  { key: "learning", label: "Learning", question: "무엇을 배웠나요?" },
];
export const experienceTypes = [
  "프로젝트",
  "인턴",
  "연구",
  "공모전",
  "동아리",
  "아르바이트",
  "개인 활동",
  "기타",
];
