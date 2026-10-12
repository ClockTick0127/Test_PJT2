import type { AppData, Experience, Portfolio } from "./types";

export function portfolioContents(portfolio: Portfolio, experiences: Experience[]) {
  const byId = new Map(experiences.map((experience) => [experience.id, experience]));
  const selected = portfolio.experienceIds
    .map((id) => byId.get(id))
    .filter((experience): experience is Experience => Boolean(experience));
  return {
    selected,
    approved: selected.filter((experience) => experience.status === "approved"),
    pending: selected.filter((experience) => experience.status !== "approved"),
  };
}

export function removeJob(data: AppData, id: string): AppData {
  return {
    ...data,
    jobs: data.jobs.filter((job) => job.id !== id),
    portfolios: data.portfolios.map((portfolio) =>
      portfolio.jobId === id ? { ...portfolio, jobId: "" } : portfolio,
    ),
  };
}

export function removePortfolio(data: AppData, id: string): AppData {
  return { ...data, portfolios: data.portfolios.filter((portfolio) => portfolio.id !== id) };
}
