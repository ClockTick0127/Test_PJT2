import type { AppData } from "@folio/shared";
import { initialData, demoExperiences } from "@folio/shared/mock-data";
const KEY = "folio-career-os-v1";
function valid(value: unknown): value is AppData {
  if (!value || typeof value !== "object") return false;
  const d = value as AppData;
  return (
    d.version === 1 &&
    !!d.profile &&
    typeof d.profile.name === "string" &&
    typeof d.profile.email === "string" &&
    Array.isArray(d.experiences) &&
    d.experiences.every(
      (e) =>
        typeof e.id === "string" &&
        typeof e.title === "string" &&
        typeof e.startDate === "string" &&
        typeof e.endDate === "string" &&
        Array.isArray(e.skills) &&
        Array.isArray(e.competencies) &&
        Array.isArray(e.evidence) &&
        Array.isArray(e.claims),
    ) &&
    Array.isArray(d.jobs) &&
    d.jobs.every((j) => typeof j.id === "string" && Array.isArray(j.skills)) &&
    Array.isArray(d.portfolios) &&
    d.portfolios.every((p) => Array.isArray(p.experienceIds))
  );
}
function migrate(data: AppData): AppData {
  return {
    ...data,
    experiences: data.experiences.map((experience) => ({
      ...experience,
      evidence: experience.evidence.map((source) => {
        if (source.supportedSkills !== undefined) return source;
        const fixture =
          experience.isDemo &&
          demoExperiences
            .find((e) => e.id === experience.id)
            ?.evidence.find((e) => e.id === source.id);
        if (fixture)
          return { ...source, content: fixture.content, supportedSkills: fixture.supportedSkills };
        // Legacy self-reports: read only the explicit technology line, never infer from an attached URL.
        const line =
          source.type === "manual"
            ? source.content.split("\n").find((v) => v.startsWith("사용 기술: "))
            : "";
        return {
          ...source,
          supportedSkills: line
            ? line
                .slice("사용 기술: ".length)
                .split(",")
                .map((v) => v.trim())
                .filter(Boolean)
            : [],
        };
      }),
    })),
  };
}
export function loadDemo(): AppData {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const parsed: unknown = JSON.parse(raw);
    if (valid(parsed)) return { ...migrate(parsed), session: true };
  }
  return { ...initialData(), session: true };
}
export function saveDemo(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data));
}
