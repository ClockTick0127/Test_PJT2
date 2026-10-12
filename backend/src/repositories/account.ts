import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { AppData, Experience, Evidence, Claim, Job, Portfolio, Profile } from "@folio/shared";

export interface EvidenceRow {
  id: string;
  type: Evidence["type"];
  source: string;
  content: string | null;
  source_url: string | null;
  reference: string | null;
  status: "unverified" | "user_confirmed" | "source_verified";
  supported_skills: string[];
}
export interface ExperienceRow {
  id: string;
  title: string;
  type: string;
  organization: string | null;
  start_date: string | null;
  end_date: string | null;
  description: string;
  role: string;
  skills: string[];
  competencies: string[];
  status: "draft" | "review" | "approved";
  color: string;
  icon: Experience["icon"];
  created_at: string;
  evidence: EvidenceRow[];
  analysis_claims: {
    section: Claim["section"];
    content: string;
    status: Claim["status"];
    evidence_id: string | null;
    claim_sources: { evidence_id: string }[];
  }[];
}
export function decodeExperience(row: ExperienceRow): Experience {
  return {
    id: row.id,
    title: row.title,
    type: row.type,
    organization: row.organization || "",
    startDate: row.start_date?.slice(0, 7) || "",
    endDate: row.end_date?.slice(0, 7) || "",
    description: row.description,
    role: row.role,
    skills: row.skills,
    competencies: row.competencies,
    status: row.status === "approved" ? "approved" : "review",
    color: row.color,
    icon: row.icon,
    createdAt: row.created_at,
    evidence: row.evidence.map((source) => ({
      id: source.id,
      type: source.type,
      source: source.source,
      content: source.content || "",
      reference: source.reference || "",
      url: source.source_url || undefined,
      status: source.status === "unverified" ? "needs_review" : source.status,
      supportedSkills: source.supported_skills,
    })),
    claims: row.analysis_claims
      .map((claim) => ({
        section: claim.section,
        content: claim.content,
        status: claim.status,
        evidenceIds: [
          ...new Set([
            ...claim.claim_sources.map((source) => source.evidence_id),
            ...(claim.evidence_id ? [claim.evidence_id] : []),
          ]),
        ],
      }))
      .sort(
        (a, b) =>
          ["problem", "role", "action", "result", "learning"].indexOf(a.section) -
          ["problem", "role", "action", "result", "learning"].indexOf(b.section),
      ),
  };
}
export interface WorkspaceChanges {
  profile?: Profile;
  experiences: Experience[];
  jobs: Job[];
  portfolios: Portfolio[];
  deletedExperiences: string[];
  deletedJobs: string[];
  deletedPortfolios: string[];
}
function changesFor<T extends { id: string }>(before: T[], after: T[]) {
  const previous = new Map(before.map((item) => [item.id, item]));
  const nextIds = new Set(after.map((item) => item.id));
  return {
    changed: after.filter((item) => JSON.stringify(item) !== JSON.stringify(previous.get(item.id))),
    removed: before.filter((item) => !nextIds.has(item.id)).map((item) => item.id),
  };
}
export function diffWorkspace(before: AppData, after: AppData): WorkspaceChanges {
  const experiences = changesFor(before.experiences, after.experiences);
  const jobs = changesFor(before.jobs, after.jobs);
  const portfolios = changesFor(before.portfolios, after.portfolios);
  if (experiences.changed.some((e) => e.isDemo) || jobs.changed.some((j) => j.isDemo)) {
    throw new Error("데모 기록은 실제 계정으로 저장할 수 없습니다.");
  }
  return {
    ...(JSON.stringify(before.profile) !== JSON.stringify(after.profile)
      ? { profile: after.profile }
      : {}),
    experiences: experiences.changed,
    jobs: jobs.changed,
    portfolios: portfolios.changed,
    deletedExperiences: experiences.removed,
    deletedJobs: jobs.removed,
    deletedPortfolios: portfolios.removed,
  };
}
export async function loadAccount(client: SupabaseClient, user: User): Promise<AppData> {
  const results = await Promise.all([
    client.from("profiles").select("name,email,headline,about").eq("id", user.id).single(),
    client
      .from("experiences")
      .select("*,evidence(*),analysis_claims(*,claim_sources(evidence_id))")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    client
      .from("job_postings")
      .select("*,job_skills(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    client
      .from("portfolios")
      .select("*,portfolio_experiences(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);
  for (const result of results) if (result.error) throw result.error;
  const [profile, experiences, jobs, portfolios] = results;
  const p = profile.data as Profile;
  return {
    version: 1,
    session: true,
    profile: {
      name: p.name,
      email: user.email || p.email,
      headline: p.headline || "",
      about: p.about || "",
    },
    experiences: (experiences.data as ExperienceRow[]).map(decodeExperience),
    jobs: (jobs.data || []).map((row) => ({
      id: row.id,
      company: row.company,
      position: row.position,
      description: row.description,
      url: row.url || undefined,
      responsibilities: row.responsibilities,
      createdAt: row.created_at,
      skills: row.job_skills.map(
        (s: { skill: string; importance: number; requirement: "required" | "preferred" }) => ({
          name: s.skill,
          importance: s.importance,
          kind: s.requirement,
        }),
      ),
    })),
    portfolios: (portfolios.data || []).map((row) => ({
      id: row.id,
      jobId: row.job_id || "",
      title: row.title,
      slug: row.slug,
      visibility: row.visibility,
      createdAt: row.created_at,
      experienceIds: row.portfolio_experiences
        .sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
        .map((item: { experience_id: string }) => item.experience_id),
    })),
  };
}
export async function saveAccount(
  client: SupabaseClient,
  before: AppData,
  after: AppData,
  userId: string,
) {
  const changes = diffWorkspace(before, after);
  if (
    !changes.profile &&
    Object.entries(changes).every(
      ([key, value]) => key === "profile" || (Array.isArray(value) && !value.length),
    )
  )
    return;
  const { error } = await client.rpc("folio_apply_changes", { changes: { ...changes, userId } });
  if (error) throw error;
}
