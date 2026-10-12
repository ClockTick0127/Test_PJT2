import test from "node:test";
import assert from "node:assert/strict";
import { initialData } from "@folio/shared/mock-data";
import { portfolioContents, removeJob, removePortfolio } from "@folio/shared/workspace";
import { diffWorkspace } from "../src/repositories/account";

test("editing an included experience hides it until approval without losing its order", () => {
  const data = initialData();
  const portfolio = data.portfolios[0];
  const before = portfolioContents(portfolio, data.experiences);
  const first = before.approved[0];
  const edited = data.experiences.map((experience) =>
    experience.id === first.id
      ? {
          ...experience,
          status: "review" as const,
          title: "Unapproved edit",
          skills: ["Unapproved skill"],
        }
      : experience,
  );
  const hidden = portfolioContents(portfolio, edited);
  assert.deepEqual(
    hidden.pending.map((experience) => experience.id),
    [first.id],
  );
  assert.equal(
    hidden.approved.some((experience) => experience.title === "Unapproved edit"),
    false,
  );
  assert.equal(
    hidden.approved.flatMap((experience) => experience.skills).includes("Unapproved skill"),
    false,
  );
  assert.deepEqual(
    hidden.selected.map((experience) => experience.id),
    portfolio.experienceIds,
  );
  const restored = portfolioContents(
    portfolio,
    edited.map((experience) => ({ ...experience, status: "approved" })),
  );
  assert.deepEqual(
    restored.approved.map((experience) => experience.id),
    portfolio.experienceIds,
  );
  assert.equal(restored.approved[0].title, "Unapproved edit");
  assert.deepEqual(
    portfolio.experienceIds,
    before.selected.map((experience) => experience.id),
  );
});

test("missing experiences are skipped without hiding other approved selections", () => {
  const data = initialData();
  const portfolio = {
    ...data.portfolios[0],
    experienceIds: ["missing", ...data.portfolios[0].experienceIds],
  };
  assert.deepEqual(
    portfolioContents(portfolio, data.experiences).approved.map((experience) => experience.id),
    data.portfolios[0].experienceIds,
  );
});

test("deleting a job detaches its portfolios while preserving experiences and unrelated jobs", () => {
  const data = initialData();
  const id = data.portfolios[0].jobId;
  const after = removeJob(data, id);
  assert.equal(
    after.jobs.some((job) => job.id === id),
    false,
  );
  assert.deepEqual(after.portfolios[0].experienceIds, data.portfolios[0].experienceIds);
  assert.equal(after.portfolios[0].jobId, "");
  assert.equal(data.portfolios[0].jobId, id);
  assert.equal(after.experiences, data.experiences);
  assert.equal(after.jobs.length, data.jobs.length - 1);
  // Account data uses the same transition but cannot upload demo fixtures.
  const account = { ...data, jobs: data.jobs.map(({ isDemo: _, ...job }) => job), experiences: [] };
  const changes = diffWorkspace(account, removeJob(account, id));
  assert.deepEqual(changes.deletedJobs, [id]);
  assert.equal(changes.portfolios[0].jobId, "");
  assert.deepEqual(changes.deletedPortfolios, []);
});

test("deleting a portfolio preserves the source documents and other portfolios", () => {
  const data = initialData();
  data.portfolios.push({ ...data.portfolios[0], id: "another", slug: "another" });
  const after = removePortfolio(data, data.portfolios[0].id);
  assert.deepEqual(
    after.portfolios.map((portfolio) => portfolio.id),
    ["another"],
  );
  assert.equal(after.experiences, data.experiences);
  assert.equal(after.jobs, data.jobs);
});
