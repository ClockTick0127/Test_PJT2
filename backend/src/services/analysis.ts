import type { Experience, ExperienceInput, Job, JobSkill, Claim } from "@folio/shared";
import { sections } from "@folio/shared";

export const canonical = (skill: string): string => {
  const normalized = skill.toLowerCase().replace(/[\s.\-_/]/g, "");
  const aliases: Record<string, string> = {
    js: "javascript",
    ts: "typescript",
    reactjs: "react",
    nextjs: "nextjs",
    restapi: "apiintegration",
    api: "apiintegration",
    api연동: "apiintegration",
    rest: "apiintegration",
    프론트엔드개발: "frontenddevelopment",
    frontend: "frontenddevelopment",
    협업: "collaboration",
    팀워크: "collaboration",
    문제해결: "problemsolving",
    ux: "uxdesign",
    추천시스템: "recommendationsystem",
    데이터분석: "dataanalysis",
    unittest: "testing",
    테스트: "testing",
    jest: "testing",
    vitest: "testing",
    githubactions: "cicd",
  };
  return aliases[normalized] || normalized;
};

export const completeness = (e: Experience): number => {
  const completeClaims = e.claims.filter(
    (c) => c.content !== "사용자 확인 필요" && c.status !== "needs_review",
  ).length;
  return Math.round(
    (completeClaims / 5) * 70 +
      (e.skills.length ? 15 : 0) +
      (e.evidence.some((v) => v.status !== "needs_review") ? 15 : 0),
  );
};

export function analyzeExperience(input: ExperienceInput): Experience {
  const id = crypto.randomUUID();
  const manualId = crypto.randomUUID();
  const skills = [
    ...new Set(
      input.skills
        .split(/[,，\n]/)
        .map((v) => v.trim())
        .filter(Boolean),
    ),
  ];
  const claims: Claim[] = sections.map(({ key }) => {
    const content = input[key].trim();
    return {
      section: key,
      content: content || "사용자 확인 필요",
      evidenceIds: content ? [manualId] : [],
      status: content ? "user_confirmed" : "needs_review",
    };
  });
  const evidence: Experience["evidence"] = [
    {
      id: manualId,
      type: "manual",
      source: "사용자가 직접 입력한 경험",
      content:
        sections.map(({ key, label }) => label + ": " + (input[key] || "미입력")).join("\n") +
        "\n사용 기술: " +
        input.skills,
      reference: "등록 원문",
      status: "user_confirmed",
      supportedSkills: skills,
    },
  ];
  if (input.github)
    evidence.push({
      id: crypto.randomUUID(),
      type: "github",
      source: "GitHub 저장소",
      url: input.github,
      content:
        "URL이 첨부되었습니다. 저장소 본문을 아직 수집하지 않아 주장 근거로 사용하지 않습니다.",
      reference: "본문 확인 필요",
      status: "needs_review",
      supportedSkills: [],
    });
  if (input.fileName)
    evidence.push({
      id: crypto.randomUUID(),
      type: "pdf",
      source: input.fileName,
      content: "파일 이름만 등록된 데모입니다. 업로드 및 본문 파싱은 다음 단계에서 연결됩니다.",
      reference: "본문 확인 필요",
      status: "needs_review",
      supportedSkills: [],
    });
  return {
    id,
    title: input.title.trim(),
    type: input.type,
    organization: input.organization.trim(),
    startDate: input.startDate,
    endDate: input.endDate,
    description: input.description.trim(),
    role: input.role.trim(),
    skills,
    competencies: [],
    evidence,
    claims,
    status: "review",
    color: "blue",
    icon: "code",
    createdAt: new Date().toISOString(),
  };
}

function supportedEvidence(experience: Experience, skill: string) {
  if (experience.status !== "approved") return [];
  // A reference URL, unrelated evidence, or an unapproved draft never supports a skill.
  return experience.evidence.filter(
    (e) =>
      e.status !== "needs_review" &&
      (e.supportedSkills || []).some((s) => canonical(s) === canonical(skill)),
  );
}

export function matchExperience(experience: Experience, job: Job) {
  const reported = [...experience.skills, ...experience.competencies].map(canonical);
  const matched = job.skills.filter(
    (s) => reported.includes(canonical(s.name)) && supportedEvidence(experience, s.name).length > 0,
  );
  const missing = job.skills.filter((s) => !matched.includes(s));
  const total = job.skills.reduce((sum, s) => sum + s.importance, 0);
  const weight = matched.reduce((sum, skill) => {
    const sourceVerified = supportedEvidence(experience, skill.name).some(
      (e) => e.status === "source_verified",
    );
    return sum + skill.importance * (sourceVerified ? 1 : 0.75);
  }, 0);
  const score = total ? Math.round((100 * weight) / total) : 0;
  const sourceVerified = matched.some((s) =>
    supportedEvidence(experience, s.name).some((e) => e.status === "source_verified"),
  );
  const reasons = matched.map((s) => {
    const source =
      supportedEvidence(experience, s.name).find((e) => e.status === "source_verified") ||
      supportedEvidence(experience, s.name)[0];
    return (
      s.name +
      " 역량이 " +
      source.source +
      "의 " +
      (source.status === "source_verified" ? "원본 근거" : "사용자 확인 입력") +
      "에 연결됩니다." +
      (experience.isDemo ? " (예시 자료)" : "")
    );
  });
  return { experience, score, matched, missing, sourceVerified, reasons };
}

export const rankExperiences = (experiences: Experience[], job: Job) =>
  experiences
    .filter((e) => e.status === "approved")
    .map((e) => matchExperience(e, job))
    .sort((a, b) => b.score - a.score);

export function skillGap(experiences: Experience[], job: Job) {
  return job.skills.filter(
    (skill) =>
      !experiences.some((e) => matchExperience(e, { ...job, skills: [skill] }).matched.length > 0),
  );
}

export const skillCatalog = [
  "React",
  "JavaScript",
  "TypeScript",
  "Next.js",
  "Python",
  "FastAPI",
  "Git",
  "API Integration",
  "UX Design",
  "Frontend Development",
  "Problem Solving",
  "Collaboration",
  "Data Analysis",
  "Research",
  "Recommendation System",
  "Testing",
  "CI/CD",
  "Figma",
  "SQL",
];
const escapeRegex = (value: string) => value.replace(/[.*+?^$()|[\]\\]/g, "\\$&");

export function parseResponsibilities(description: string): string[] {
  const lines = description
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  let inDuties = !lines.some((line) => /주요\s*업무|담당\s*업무|responsibilities/i.test(line));
  const duties: string[] = [];
  for (const line of lines) {
    if (/주요\s*업무|담당\s*업무|responsibilities/i.test(line)) {
      inDuties = true;
      const inline = line.split(/[:：]/).slice(1).join(":").trim();
      if (inline) duties.push(inline);
      continue;
    }
    if (/필수|우대|자격\s*요건|required|preferred/i.test(line)) {
      inDuties = false;
      continue;
    }
    if (inDuties) duties.push(line);
  }
  return duties.slice(0, 8);
}

export function parseJob(description: string, extraSkills: string): JobSkill[] {
  let section: "required" | "preferred" = "required";
  const kinds = new Map<string, "required" | "preferred">();
  for (const line of description.split(/\n/)) {
    if (/우대|preferred|nice.to.have/i.test(line)) section = "preferred";
    if (/필수|자격\s*요건|required|주요\s*업무/i.test(line)) section = "required";
    for (const name of skillCatalog) {
      if (new RegExp("(^|[^a-z0-9])" + escapeRegex(name) + "([^a-z0-9]|$)", "i").test(line)) {
        // A required occurrence takes precedence over a preferred occurrence.
        if (!kinds.has(name) || section === "required") kinds.set(name, section);
      }
    }
  }
  for (const name of extraSkills
    .split(/[,，\n]/)
    .map((s) => s.trim())
    .filter(Boolean)) {
    const existing = [...kinds.keys()].find((key) => canonical(key) === canonical(name));
    if (!existing) kinds.set(name, "required");
  }
  return [...kinds].map(([name, kind]) => ({
    name,
    importance: kind === "preferred" ? 2 : 5,
    kind,
  }));
}
