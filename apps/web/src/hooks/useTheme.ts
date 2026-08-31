"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/client";

export type ThemeId = string;
const LOCAL_KEY = "oshiapp:themeId";
const SYNC_DEBOUNCE_MS = 800;

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

async function fetchServerThemeViaFastAPI(token?: string) {
  try {
    const res = await fetch(`${apiBase()}/user/theme`, {
      method: "GET",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: "include",
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.theme ?? null;
  } catch {
    return null;
  }
}

async function putServerThemeViaFastAPI(theme: ThemeId, token?: string) {
  try {
    const res = await fetch(`${apiBase()}/user/theme`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      credentials: "include",
      body: JSON.stringify({ theme }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function useTheme(defaultTheme: ThemeId = "default") {
  const [themeId, setThemeId] = useState<ThemeId>(() => {
    try {
      if (typeof window === "undefined") return defaultTheme;
      return (localStorage.getItem(LOCAL_KEY) as ThemeId) ?? defaultTheme;
    } catch {
      return defaultTheme;
    }
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const mounted = useRef(false);
  const debounceTimer = useRef<number | null>(null);

  const applyDataTheme = useCallback((t: ThemeId) => {
    if (typeof document === "undefined") return;
    document.documentElement.setAttribute("data-theme", t);
  }, []);

  // ローカル保存と即時適用
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_KEY, themeId);
    } catch {
      /* ignore */
    }
    applyDataTheme(themeId);
  }, [themeId, applyDataTheme]);

  // サーバー同期（デバウンス）
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(async () => {
      setIsSyncing(true);
      try {
        const supabase = tryCreateClient();
        if (supabase) {
          try {
            const { error } = await supabase.auth.updateUser({
              data: { theme: themeId },
            });
            if (!error) return;
          } catch {
            /* FastAPI にフォールバック */
          }
          const session = await supabase.auth.getSession();
          const token = session.data?.session?.access_token;
          await putServerThemeViaFastAPI(themeId, token);
        }
      } finally {
        setIsSyncing(false);
      }
    }, SYNC_DEBOUNCE_MS);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
  }, [themeId]);

  // マウント時：サーバー値を優先（Supabase → FastAPI）
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const supabase = tryCreateClient();
        if (!supabase) return;

        const { data: userData } = await supabase.auth.getUser();
        const serverMetaTheme = userData?.user?.user_metadata?.theme as
          | ThemeId
          | undefined;
        if (serverMetaTheme) {
          if (alive) setThemeId(serverMetaTheme);
          return;
        }

        const session = await supabase.auth.getSession();
        const token = session.data?.session?.access_token;
        const fastapiTheme = await fetchServerThemeViaFastAPI(token);
        if (fastapiTheme && alive) {
          setThemeId(fastapiTheme);
          return;
        }

        const local = localStorage.getItem(LOCAL_KEY) as ThemeId | null;
        if (local && local !== defaultTheme) {
          const { error } = await supabase.auth
            .updateUser({ data: { theme: local } })
            .catch(() => ({ error: true as const }));
          if (!error) return;
          const session2 = await supabase.auth.getSession();
          await putServerThemeViaFastAPI(
            local,
            session2.data?.session?.access_token,
          );
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      alive = false;
    };
  }, [defaultTheme]);

  const setTheme = useCallback((t: ThemeId) => setThemeId(t), []);
  const resetToDefault = useCallback(() => {
    setThemeId(defaultTheme);
    try {
      localStorage.removeItem(LOCAL_KEY);
    } catch {
      /* ignore */
    }
  }, [defaultTheme]);

  return { themeId, setTheme, resetToDefault, isSyncing };
}
