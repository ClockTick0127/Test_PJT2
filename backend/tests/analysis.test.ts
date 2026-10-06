import test from "node:test";
import assert from "node:assert/strict";
import {
  analyzeExperience,
  matchExperience,
  parseJob,
  skillGap,
  canonical,
  rankExperiences,
} from "../src/services/analysis";
import { demoExperiences, demoJobs } from "@folio/shared/mock-data";
import type { ExperienceInput, Job } from "@folio/shared";

const input: ExperienceInput = {
  title: "실제 입력",
  type: "프로젝트",
  organization: "",
  startDate: "",
  endDate: "",
  description: "작은 서비스 구현",
  role: "프론트엔드",
  skills: "React, JavaScript",
  problem: "",
  action: "React 화면 구현",
  result: "",
  learning: "",
  github: "https://github.com/example/project",
  fileName: "발표자료.pdf",
};
const job: Job = {
  id: "test",
  company: "테스트",
  position: "개발자",
  description: "",
  skills: [{ name: "React", importance: 5, kind: "required" }],
  responsibilities: [],
  createdAt: "",
};

test("missing results and metrics remain unconfirmed", () => {
  const e = analyzeExperience(input);
  assert.equal(e.claims.find((c) => c.section === "result")?.content, "사용자 확인 필요");
  assert.equal(e.claims.find((c) => c.section === "result")?.status, "needs_review");
  assert.equal(e.claims.find((c) => c.section === "action")?.content, input.action);
  assert.equal(e.claims.find((c) => c.section === "action")?.evidenceIds[0], e.evidence[0].id);
  assert.equal(
    e.evidence.filter((v) => v.type !== "manual").every((v) => v.status === "needs_review"),
    true,
  );
  assert.equal(JSON.stringify(e.claims).includes("30%"), false);
});
test("drafts do not match until user approval", () => {
  const e = analyzeExperience(input);
  assert.equal(matchExperience(e, job).score, 0);
  assert.equal(rankExperiences([e], job).length, 0);
  e.status = "approved";
  assert.equal(matchExperience(e, job).score, 75);
});
test("a URL or an unrelated source cannot substantiate skills", () => {
  const e = analyzeExperience(input);
  e.status = "approved";
  e.evidence[0].supportedSkills = ["Python"];
  assert.equal(matchExperience(e, job).score, 0);
  assert.deepEqual(
    skillGap([e], job).map((s) => s.name),
    ["React"],
  );
});
test("a source-backed skill must not inflate another self-reported skill", () => {
  const e = analyzeExperience(input);
  e.status = "approved";
  e.evidence.push({
    id: "verified",
    source: "코드",
    type: "github",
    reference: "file.tsx",
    content: "React",
    status: "source_verified",
    supportedSkills: ["React"],
  });
  const both = {
    ...job,
    skills: [...job.skills, { name: "JavaScript", importance: 5, kind: "required" as const }],
  };
  assert.equal(matchExperience(e, both).score, 88);
});
test("preferred sections retain their weight across newlines", () => {
  const parsed = parseJob("필수 역량\nReact, JavaScript\n우대 사항\nTypeScript\nTesting", "");
  assert.equal(parsed.find((s) => s.name === "TypeScript")?.kind, "preferred");
  assert.equal(parsed.find((s) => s.name === "Testing")?.importance, 2);
  assert.equal(parsed.find((s) => s.name === "React")?.importance, 5);
});
test("skill boundaries prevent Java from matching JavaScript or Git in GitHub", () => {
  assert.deepEqual(parseJob("GitHub에 결과를 게시합니다.", ""), []);
  assert.equal(canonical("REST API"), canonical("API Integration"));
  assert.equal(canonical("TypeScript"), canonical("TS"));
  assert.equal(parseJob("React React", "react, React").length, 1);
});
test("demo rank and skill gap are derived consistently", () => {
  const ranked = rankExperiences(demoExperiences, demoJobs[0]);
  assert.equal(ranked[0].experience.id, "playground");
  assert.equal(ranked[0].score, 81);
  assert.deepEqual(
    skillGap(demoExperiences, demoJobs[0]).map((s) => s.name),
    ["TypeScript", "Testing", "CI/CD"],
  );
});
test("empty requirements produce zero, never NaN", () => {
  assert.equal(matchExperience(demoExperiences[0], { ...job, skills: [] }).score, 0);
  assert.deepEqual(skillGap([], { ...job, skills: [] }), []);
});
