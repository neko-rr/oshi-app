"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { API_PATHS } from "@oshi/shared";
import { createClient } from "@/lib/client";
import {
  applyOshiAccentToDocument,
  defaultServerState,
  readLocalDraft,
  writeLocalDraft,
  type OshiAccentDraft,
  type OshiAccentServerState,
} from "@/lib/oshiAccentPrefs";
import {
  tryResolveOshiColors,
  type ResolvedOshiColors,
} from "@/lib/oshiContrast";

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

export type OshiAccentContextValue = {
  draft: OshiAccentDraft;
  resolved: ResolvedOshiColors | null;
  server: OshiAccentServerState;
  /** 設定画面での「アプリ全体で試し見」（既定 OFF。見本ボックスは常に独立） */
  previewLive: boolean;
  setMainHex: (hex: string) => void;
  setSubHex: (hex: string) => void;
  setPreviewLive: (on: boolean) => void;
  /** entitled 時のみ。未 entitled は false */
  applyLocked: boolean;
  refreshFromServer: () => Promise<void>;
  saveToServer: (opts: {
    active: boolean;
  }) => Promise<{ ok: boolean; code?: string; message?: string }>;
};

export const OshiAccentContext = createContext<OshiAccentContextValue | null>(
  null,
);

export function useOshiAccentState(): OshiAccentContextValue {
  const [draft, setDraft] = useState<OshiAccentDraft>(() => readLocalDraft());
  const [server, setServer] = useState<OshiAccentServerState>(defaultServerState);
  const [previewLive, setPreviewLive] = useState(false);

  const resolved = useMemo(
    () => tryResolveOshiColors(draft.main_hex, draft.sub_hex),
    [draft.main_hex, draft.sub_hex],
  );

  const setMainHex = useCallback((hex: string) => {
    setDraft((prev) => {
      const next = { ...prev, main_hex: hex };
      writeLocalDraft(next);
      return next;
    });
  }, []);

  const setSubHex = useCallback((hex: string) => {
    setDraft((prev) => {
      const next = { ...prev, sub_hex: hex };
      writeLocalDraft(next);
      return next;
    });
  }, []);

  const refreshFromServer = useCallback(async () => {
    const supabase = tryCreateClient();
    if (!supabase) return;
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) return;
      const res = await fetch(`${apiBase()}${API_PATHS.oshiAccentSettings}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = (await res.json()) as OshiAccentServerState;
      setServer({
        ...defaultServerState(),
        ...json,
        entitled: Boolean(json.entitled),
        active: Boolean(json.active) && Boolean(json.entitled),
      });
      if (json.entitled && json.active) {
        setDraft({ main_hex: json.main_hex, sub_hex: json.sub_hex });
        writeLocalDraft({ main_hex: json.main_hex, sub_hex: json.sub_hex });
      }
    } catch {
      /* ignore */
    }
  }, []);

  const saveToServer = useCallback(
    async (opts: { active: boolean }) => {
      if (!server.entitled) {
        return {
          ok: false,
          code: "PREMIUM_REQUIRED",
          message: "premium",
        };
      }
      const supabase = tryCreateClient();
      if (!supabase || !resolved) {
        return { ok: false, code: "VALIDATION_ERROR", message: "invalid" };
      }
      try {
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token) {
          return { ok: false, code: "UNAUTHORIZED", message: "auth" };
        }
        const res = await fetch(`${apiBase()}${API_PATHS.oshiAccentSettings}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            main_hex: draft.main_hex,
            sub_hex: draft.sub_hex,
            active: opts.active,
            presets: server.presets,
          }),
        });
        if (res.status === 403) {
          return { ok: false, code: "PREMIUM_REQUIRED", message: "premium" };
        }
        if (!res.ok) {
          return { ok: false, code: "VALIDATION_ERROR", message: "save" };
        }
        const json = (await res.json()) as OshiAccentServerState;
        setServer({
          ...defaultServerState(),
          ...json,
          entitled: true,
        });
        return { ok: true };
      } catch {
        return { ok: false, code: "INTERNAL_ERROR", message: "network" };
      }
    },
    [draft.main_hex, draft.sub_hex, resolved, server.entitled, server.presets],
  );

  useEffect(() => {
    if (server.entitled && server.active && resolved) {
      applyOshiAccentToDocument("on", resolved);
      return;
    }
    if (previewLive && resolved) {
      applyOshiAccentToDocument("preview", resolved);
      return;
    }
    applyOshiAccentToDocument("off", null);
  }, [previewLive, resolved, server.active, server.entitled]);

  useEffect(() => {
    void refreshFromServer();
  }, [refreshFromServer]);

  return {
    draft,
    resolved,
    server,
    previewLive,
    setMainHex,
    setSubHex,
    setPreviewLive,
    applyLocked: !server.entitled,
    refreshFromServer,
    saveToServer,
  };
}

export function useOshiAccent(): OshiAccentContextValue {
  const ctx = useContext(OshiAccentContext);
  if (!ctx) {
    throw new Error("useOshiAccent must be used within OshiAccentProvider");
  }
  return ctx;
}
