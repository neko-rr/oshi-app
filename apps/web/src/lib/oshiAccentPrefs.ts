/**
 * 推し色のプレビュー用ドラフト（localStorage）。
 * 全体適用の永続化はサーバー＋entitlement。
 */

import {
  DEFAULT_MAIN_HEX,
  DEFAULT_SUB_HEX,
  FG_NEAR_BLACK,
  FG_WHITE,
  normalizeHex,
  softSurface,
  tryResolveOshiColors,
  type ResolvedOshiColors,
} from "@/lib/oshiContrast";

export const OSHI_ACCENT_LOCAL_KEY = "oshiapp:oshiAccentDraft";
export const MAX_OSHI_PRESETS = 3;

export type OshiAccentPreset = {
  name: string;
  main_hex: string;
  sub_hex: string;
};

export type OshiAccentDraft = {
  main_hex: string;
  sub_hex: string;
};

export type OshiAccentServerState = ResolvedOshiColors & {
  active: boolean;
  presets: OshiAccentPreset[];
  entitled: boolean;
  max_presets: number;
};

export function defaultDraft(): OshiAccentDraft {
  return { main_hex: DEFAULT_MAIN_HEX, sub_hex: DEFAULT_SUB_HEX };
}

export function defaultServerState(): OshiAccentServerState {
  const resolved = tryResolveOshiColors(DEFAULT_MAIN_HEX, DEFAULT_SUB_HEX);
  return {
    main_hex: DEFAULT_MAIN_HEX,
    sub_hex: DEFAULT_SUB_HEX,
    main_foreground: resolved?.main_foreground ?? FG_WHITE,
    soft_bg: resolved?.soft_bg ?? softSurface(DEFAULT_SUB_HEX),
    soft_foreground: resolved?.soft_foreground ?? FG_NEAR_BLACK,
    active: false,
    presets: [],
    entitled: false,
    max_presets: MAX_OSHI_PRESETS,
  };
}

export function sanitizeDraft(raw: unknown): OshiAccentDraft {
  const fallback = defaultDraft();
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  try {
    const main_hex = normalizeHex(String(obj.main_hex ?? ""));
    const sub_hex = normalizeHex(String(obj.sub_hex ?? ""));
    if (!tryResolveOshiColors(main_hex, sub_hex)) return fallback;
    return { main_hex, sub_hex };
  } catch {
    return fallback;
  }
}

export function readLocalDraft(): OshiAccentDraft {
  try {
    if (typeof window === "undefined") return defaultDraft();
    const raw = localStorage.getItem(OSHI_ACCENT_LOCAL_KEY);
    if (!raw) return defaultDraft();
    return sanitizeDraft(JSON.parse(raw) as unknown);
  } catch {
    return defaultDraft();
  }
}

export function writeLocalDraft(draft: OshiAccentDraft): void {
  try {
    if (typeof window === "undefined") return;
    const clean = sanitizeDraft(draft);
    localStorage.setItem(OSHI_ACCENT_LOCAL_KEY, JSON.stringify(clean));
  } catch {
    /* ignore */
  }
}

export type OshiApplyMode = "off" | "preview" | "on";

export function applyOshiAccentToDocument(
  mode: OshiApplyMode,
  colors: ResolvedOshiColors | null,
): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (mode === "off" || !colors) {
    root.removeAttribute("data-oshi-accent");
    root.style.removeProperty("--primary");
    root.style.removeProperty("--primary-foreground");
    root.style.removeProperty("--ring");
    root.style.removeProperty("--accent");
    root.style.removeProperty("--accent-foreground");
    root.style.removeProperty("--oshi-soft");
    root.style.removeProperty("--oshi-soft-foreground");
    root.style.removeProperty("--sidebar-primary");
    root.style.removeProperty("--sidebar-primary-foreground");
    return;
  }
  root.setAttribute("data-oshi-accent", mode);
  root.style.setProperty("--primary", colors.main_hex);
  root.style.setProperty("--primary-foreground", colors.main_foreground);
  root.style.setProperty("--ring", colors.main_hex);
  root.style.setProperty("--accent", colors.soft_bg);
  root.style.setProperty("--accent-foreground", colors.soft_foreground);
  root.style.setProperty("--oshi-soft", colors.soft_bg);
  root.style.setProperty("--oshi-soft-foreground", colors.soft_foreground);
  root.style.setProperty("--sidebar-primary", colors.main_hex);
  root.style.setProperty(
    "--sidebar-primary-foreground",
    colors.main_foreground,
  );
}
