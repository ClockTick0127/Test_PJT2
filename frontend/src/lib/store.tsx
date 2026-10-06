"use client";
import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { AppData } from "@folio/shared";
import { initialData, emptyData, demoExperiences } from "@folio/shared/mock-data";

const KEY = "folio-career-os-v1";
type Context = {
  data: AppData;
  ready: boolean;
  storageError: string;
  update: (fn: (d: AppData) => AppData) => void;
  startDemo: () => void;
  startFresh: (name: string, email: string) => void;
  toast: (message: string) => void;
};
const AppContext = createContext<Context | null>(null);
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
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(initialData);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (valid(parsed)) setData(migrate(parsed));
        else setStorageError("저장된 데이터를 읽을 수 없어 예시 데이터로 시작했습니다.");
      }
    } catch {
      setStorageError(
        "브라우저 저장소를 사용할 수 없습니다. 변경 내용은 이번 실행 중에만 유지됩니다.",
      );
    }
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      setStorageError("저장 공간이 부족하거나 저장소가 차단되어 변경 내용을 저장하지 못했습니다.");
    }
  }, [data, ready]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const update = useCallback((fn: (d: AppData) => AppData) => setData(fn), []);
  return (
    <AppContext.Provider
      value={{
        data,
        ready,
        storageError,
        update,
        startDemo: () => {
          setData({ ...initialData(), session: true });
          setNotice("예시 경험이 있는 데모로 시작합니다.");
        },
        startFresh: (name, email) => {
          setData({ ...emptyData(name, email), session: true });
        },
        toast: setNotice,
      }}
    >
      {children}
      {notice && (
        <div className="toast" role="status">
          <span className="toast-check">✓</span>
          {notice}
          <button aria-label="알림 닫기" onClick={() => setNotice("")}>
            ×
          </button>
        </div>
      )}
    </AppContext.Provider>
  );
}
export const useStore = () => {
  const value = useContext(AppContext);
  if (!value) throw new Error("StoreProvider is required");
  return value;
};
