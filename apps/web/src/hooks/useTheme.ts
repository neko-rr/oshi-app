"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { API_PATHS } from "@oshi/shared";
import { createClient } from "@/lib/client";
import {
  DEFAULT_THEME_ID,
  THEME_IDS,
  THEME_OPTIONS,
  findThemeOption,
} from "@/lib/themes/catalog";

export type ThemeId = string;
export { DEFAULT_THEME_ID, THEME_OPTIONS };

const LOCAL_KEY = "oshiapp:themeId";
const SYNC_DEBOUNCE_MS = 800;

const ALLOWED = new Set<string>(THEME_IDS);

export type ThemeContextValue = {
  themeId: ThemeId;
  setTheme: (t: ThemeId) => void;
  resetToDefault: () => void;
  isSyncing: boolean;
  current: ReturnType<typeof findThemeOption>;
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000"
  );
}

function tryCreateClient() {
  try {
    return createClient();
  } catch {
    return null;
  }
}

function sanitizeTheme(raw: unknown, fallback: ThemeId): ThemeId {
  if (typeof raw === "string" && ALLOWED.has(raw)) return raw;
  return fallback;
}

async function fetchThemeViaFastAPI(token: string): Promise<ThemeId | null> {
  try {
    const res = await fetch(`${apiBase()}${API_PATHS.themeSettings}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { theme?: string };
    return sanitizeTheme(json?.theme, DEFAULT_THEME_ID);
  } catch {
    return null;
  }
}

async function putThemeViaFastAPI(
  theme: ThemeId,
  token: string,
): Promise<boolean> {
  try {
    const res = await fetch(`${apiBase()}${API_PATHS.themeSettings}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ theme }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Provider 用（JSX なし）。layout の ThemeRoot から呼ぶ。 */
export function useThemeState(
  defaultTheme: ThemeId = DEFAULT_THEME_ID,
): ThemeContextValue {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      if (typeof window === "undefined") return defaultTheme;
      const local = localStorage.getItem(LOCAL_KEY);
      return sanitizeTheme(local, defaultTheme);
    } catch {
      return defaultTheme;
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const mounted = useRef(false);
  const debounceTimer = useRef<number | null>(null);
  const skipNextSync = useRef(false);

  const applyDataTheme = useCallback((t: ThemeId) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute(
      "data-theme",
      sanitizeTheme(t, DEFAULT_THEME_ID),
    );
  }, []);

  useEffect(() => {
    const safe = sanitizeTheme(themeId, defaultTheme);
    try {
      localStorage.setItem(LOCAL_KEY, safe);
    } catch {
      /* ignore */
    }
    applyDataTheme(safe);
  }, [themeId, applyDataTheme, defaultTheme]);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (skipNextSync.current) {
      skipNextSync.current = false;
      return;
    }
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(async () => {
      setIsSyncing(true);
      try {
        const supabase = tryCreateClient();
        if (!supabase) return;
        const session = await supabase.auth.getSession();
        const token = session.data?.session?.access_token;
        if (!token) return;
        await putThemeViaFastAPI(
          sanitizeTheme(themeId, defaultTheme),
          token,
        );
      } finally {
        setIsSyncing(false);
      }
    }, SYNC_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [themeId, defaultTheme]);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const supabase = tryCreateClient();
        if (!supabase) return;
        const session = await supabase.auth.getSession();
        const token = session.data?.session?.access_token;
        if (!token) return;
        const serverTheme = await fetchThemeViaFastAPI(token);
        if (serverTheme && alive) {
          skipNextSync.current = true;
          setThemeId(serverTheme);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const setTheme = useCallback(
    (t: ThemeId) => setThemeId(sanitizeTheme(t, defaultTheme)),
    [defaultTheme],
  );
  const resetToDefault = useCallback(() => {
    setThemeId(defaultTheme);
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* ignore */
    }
  }, [defaultTheme]);

  const current = findThemeOption(themeId);

  return useMemo(
    () => ({
      themeId,
      setTheme,
      resetToDefault,
      isSyncing,
      current,
    }),
    [themeId, setTheme, resetToDefault, isSyncing, current],
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme は ThemeRoot 内で使ってください");
  }
  return ctx;
}
