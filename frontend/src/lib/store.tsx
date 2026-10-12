"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import type { AppData } from "@folio/shared";
import { emptyData, initialData } from "@folio/shared/mock-data";
import type { Session } from "@supabase/supabase-js";
import { loadAccount, saveAccount } from "@folio/backend/account";
import { getSupabase, supabaseConfigured } from "./supabase";
import { loadDemo, saveDemo } from "./demo-storage";

type Mode = "guest" | "demo" | "account";
type Context = {
  data: AppData;
  ready: boolean;
  mode: Mode;
  configured: boolean;
  saving: boolean;
  storageError: string;
  accountLoaded: boolean;
  update: (fn: (data: AppData) => AppData) => Promise<boolean>;
  startDemo: (reset?: boolean) => Promise<boolean>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<"signed_in" | "verify">;
  logout: () => Promise<boolean>;
  reload: () => Promise<void>;
  toast: (message: string) => void;
};
const AppContext = createContext<Context | null>(null);
const MODE_KEY = "folio-workspace-mode-v2";
export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => emptyData());
  const [ready, setReady] = useState(false);
  const [mode, setMode] = useState<Mode>("guest");
  const [saving, setSaving] = useState(false);
  const [storageError, setStorageError] = useState("");
  const [accountLoaded, setAccountLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const dataRef = useRef(data);
  const modeRef = useRef<Mode>("guest");
  const userRef = useRef<string | null>(null);
  const loadedRef = useRef(false);
  const epoch = useRef(0);
  const loading = useRef<{ user: string; task: Promise<void> } | null>(null);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const writeCount = useRef(0);
  const commit = useCallback((value: AppData) => {
    dataRef.current = value;
    setData(value);
  }, []);
  const changeMode = useCallback((value: Mode) => {
    modeRef.current = value;
    setMode(value);
  }, []);
  const clearAccount = useCallback(() => {
    epoch.current++;
    userRef.current = null;
    loadedRef.current = false;
    loading.current = null;
    setAccountLoaded(false);
    setStorageError("");
    commit(emptyData());
    changeMode("guest");
    setReady(true);
  }, [commit, changeMode]);
  const activate = useCallback(
    (session: Session | null, force = false): Promise<void> => {
      if (!session) {
        if (modeRef.current !== "demo") clearAccount();
        else setReady(true);
        return Promise.resolve();
      }
      if (
        !force &&
        loadedRef.current &&
        userRef.current === session.user.id &&
        modeRef.current === "account"
      )
        return Promise.resolve();
      if (!force && loading.current?.user === session.user.id) return loading.current.task;
      const client = getSupabase();
      if (!client) return Promise.reject(new Error("Supabase가 설정되지 않았습니다."));
      const version = ++epoch.current;
      userRef.current = session.user.id;
      loadedRef.current = false;
      setAccountLoaded(false);
      changeMode("account");
      setReady(false);
      setStorageError("");
      commit({
        ...emptyData(session.user.user_metadata.name || "사용자", session.user.email || ""),
        session: true,
      });
      const task = (async () => {
        try {
          const account = await loadAccount(client, session.user);
          if (version !== epoch.current) return;
          commit(account);
          loadedRef.current = true;
          setAccountLoaded(true);
        } catch {
          if (version === epoch.current)
            setStorageError(
              "계정의 기록을 불러오지 못했습니다. DB 마이그레이션과 연결을 확인한 뒤 다시 불러와 주세요.",
            );
        } finally {
          if (version === epoch.current) {
            loading.current = null;
            setReady(true);
          }
        }
      })();
      loading.current = { user: session.user.id, task };
      return task;
    },
    [clearAccount, commit, changeMode],
  );

  useEffect(() => {
    let alive = true;
    let unsubscribe = () => {};
    let timer: ReturnType<typeof setTimeout> | undefined;
    const initialize = async () => {
      try {
        if (localStorage.getItem(MODE_KEY) === "demo") {
          commit(loadDemo());
          changeMode("demo");
        }
        const client = getSupabase();
        if (!client) {
          setReady(true);
          return;
        }
        const { data: auth, error } = await client.auth.getSession();
        if (!alive) return;
        if (error) throw error;
        const { data: listener } = client.auth.onAuthStateChange((event, session) => {
          if (event === "SIGNED_OUT") {
            clearTimeout(timer);
            if (modeRef.current !== "demo") clearAccount();
            return;
          }
          if (session?.user.id === userRef.current && loadedRef.current) return;
          if (session && session.user.id !== userRef.current) {
            epoch.current++;
            loadedRef.current = false;
            setAccountLoaded(false);
            setReady(false);
            commit(emptyData());
          }
          clearTimeout(timer);
          timer = setTimeout(() => {
            if (alive) void activate(session);
          }, 0);
        });
        unsubscribe = () => listener.subscription.unsubscribe();
        await activate(auth.session);
        if (!alive) {
          unsubscribe();
          return;
        }
      } catch {
        if (alive) {
          clearAccount();
          setStorageError("로그인 정보를 확인하지 못했습니다. 다시 로그인해 주세요.");
        }
      }
    };
    void initialize();
    return () => {
      alive = false;
      unsubscribe();
      clearTimeout(timer);
      epoch.current++;
      loading.current = null;
    };
  }, [activate, changeMode, clearAccount, commit]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timer);
  }, [notice]);
  const update = useCallback(
    (fn: (value: AppData) => AppData): Promise<boolean> => {
      const version = epoch.current;
      writeCount.current++;
      setSaving(true);
      const task = queue.current
        .catch(() => {})
        .then(async () => {
          try {
            if (version !== epoch.current) return false;
            const before = dataRef.current;
            const after = fn(before);
            if (modeRef.current === "demo") saveDemo(after);
            else if (modeRef.current === "account" && loadedRef.current && userRef.current) {
              const client = getSupabase();
              if (!client) throw new Error("No database");
              await saveAccount(client, before, after, userRef.current);
            } else throw new Error("로그인 후 기록을 저장할 수 있습니다.");
            if (version !== epoch.current) return false;
            commit(after);
            setStorageError("");
            return true;
          } catch {
            if (version === epoch.current)
              setStorageError(
                "저장하지 못했습니다. 변경 내용은 반영되지 않았습니다. 연결 상태를 확인하고 다시 시도해 주세요.",
              );
            return false;
          } finally {
            writeCount.current--;
            if (!writeCount.current) setSaving(false);
          }
        });
      queue.current = task;
      return task;
    },
    [commit],
  );
  const logout = useCallback(async () => {
    try {
      const client = getSupabase();
      if (client) {
        const { error } = await client.auth.signOut({ scope: "local" });
        if (error) throw error;
      }
      try {
        localStorage.removeItem(MODE_KEY);
      } catch {}
      clearAccount();
      return true;
    } catch {
      setStorageError("로그아웃하지 못했습니다. 다시 시도해 주세요.");
      return false;
    }
  }, [clearAccount]);
  const startDemo = useCallback(
    async (reset = false) => {
      if (!(await logout())) return false;
      try {
        const sample = reset ? { ...initialData(), session: true } : loadDemo();
        saveDemo(sample);
        localStorage.setItem(MODE_KEY, "demo");
        changeMode("demo");
        commit(sample);
        setNotice("실제 계정과 분리된 예시 문서함입니다.");
        return true;
      } catch {
        setStorageError("데모 기록을 브라우저에 저장하지 못했습니다.");
        return false;
      }
    },
    [logout, changeMode, commit],
  );
  const signIn = useCallback(
    async (email: string, password: string) => {
      const client = getSupabase();
      if (!client) throw new Error("Supabase is not configured");
      const { data: auth, error } = await client.auth.signInWithPassword({ email, password });
      if (error) throw error;
      try {
        localStorage.removeItem(MODE_KEY);
      } catch {}
      await activate(auth.session);
    },
    [activate],
  );
  const signUp = useCallback(
    async (name: string, email: string, password: string) => {
      const client = getSupabase();
      if (!client) throw new Error("Supabase is not configured");
      const { data: auth, error } = await client.auth.signUp({
        email,
        password,
        options: { data: { name }, emailRedirectTo: window.location.origin + "/login" },
      });
      if (error) throw error;
      if (!auth.session) return "verify" as const;
      try {
        localStorage.removeItem(MODE_KEY);
      } catch {}
      await activate(auth.session);
      return "signed_in" as const;
    },
    [activate],
  );
  const reload = useCallback(async () => {
    const client = getSupabase();
    if (!client) return;
    const { data: auth, error } = await client.auth.getSession();
    if (error) {
      setStorageError("로그인 정보를 확인하지 못했습니다.");
      return;
    }
    await activate(auth.session, true);
  }, [activate]);
  return (
    <AppContext.Provider
      value={{
        data,
        ready,
        mode,
        configured: supabaseConfigured,
        saving,
        storageError,
        accountLoaded,
        update,
        startDemo,
        signIn,
        signUp,
        logout,
        reload,
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
