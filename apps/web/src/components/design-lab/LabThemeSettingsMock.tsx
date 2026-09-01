"use client";

import { useState, type CSSProperties } from "react";
import type { LabUiState, LabVariantId } from "@/components/design-lab/lab-meta";

/**
 * Lab 専用のテーマ見本色（本番 colors.css の近似。部品には載せない）。
 * タップで背景・文字・カード・ボタンが一式変わることを見せる。
 */
export type LabThemePack = {
  id: string;
  label: string;
  /** light = 枠黒 / dark = 枠白（明暗の見分け） */
  scheme: "light" | "dark";
  /** スウォッチ表示色 */
  swatch: string;
  bg: string;
  fg: string;
  muted: string;
  surface: string;
  border: string;
  primary: string;
  primaryFg: string;
};

/** todo-app / colors.css のテーマ ID に対応する見本（緑 default 先頭） */
export const LAB_THEME_PACKS: readonly LabThemePack[] = [
  {
    id: "default",
    label: "緑（既定）",
    scheme: "light",
    swatch: "#b8e05c",
    bg: "#f7f7f5",
    fg: "#2a2620",
    muted: "#6b6660",
    surface: "#ffffff",
    border: "#d4d0c8",
    primary: "#b8e05c",
    primaryFg: "#2a2620",
  },
  {
    id: "lime-right",
    label: "ライム",
    scheme: "light",
    swatch: "#a3e635",
    bg: "#f7f7f5",
    fg: "#2a2620",
    muted: "#6b6660",
    surface: "#ffffff",
    border: "#d4d0c8",
    primary: "#a3e635",
    primaryFg: "#2a2620",
  },
  {
    id: "lime-dark",
    label: "ライム（暗）",
    scheme: "dark",
    swatch: "#84cc16",
    bg: "#1a1f14",
    fg: "#f0f4e8",
    muted: "#a3b08a",
    surface: "#242b1c",
    border: "#3d4630",
    primary: "#84cc16",
    primaryFg: "#1a1f14",
  },
  {
    id: "emerald-dark",
    label: "エメラルド（暗）",
    scheme: "dark",
    swatch: "#34d399",
    bg: "#141f1c",
    fg: "#e8f5f0",
    muted: "#8aafa0",
    surface: "#1c2b26",
    border: "#2f433c",
    primary: "#34d399",
    primaryFg: "#141f1c",
  },
  {
    id: "sky-dark",
    label: "スカイ（暗）",
    scheme: "dark",
    swatch: "#38bdf8",
    bg: "#141a22",
    fg: "#e8f0f8",
    muted: "#8a9eb0",
    surface: "#1c2530",
    border: "#2f3d4d",
    primary: "#38bdf8",
    primaryFg: "#141a22",
  },
  {
    id: "blue-dark",
    label: "ブルー（暗）",
    scheme: "dark",
    swatch: "#3b82f6",
    bg: "#141822",
    fg: "#e8eef8",
    muted: "#8a96b0",
    surface: "#1c2230",
    border: "#2f384d",
    primary: "#3b82f6",
    primaryFg: "#ffffff",
  },
  {
    id: "pink-dark",
    label: "ピンク（暗）",
    scheme: "dark",
    swatch: "#f472b6",
    bg: "#1f141a",
    fg: "#f8e8f0",
    muted: "#b08a9e",
    surface: "#2b1c24",
    border: "#43303a",
    primary: "#f472b6",
    primaryFg: "#1f141a",
  },
  {
    id: "purple-dark",
    label: "パープル（暗）",
    scheme: "dark",
    swatch: "#a78bfa",
    bg: "#1a1422",
    fg: "#f0e8f8",
    muted: "#9e8ab0",
    surface: "#241c30",
    border: "#3a3048",
    primary: "#a78bfa",
    primaryFg: "#ffffff",
  },
  {
    id: "orange-dark",
    label: "オレンジ（暗）",
    scheme: "dark",
    swatch: "#fb923c",
    bg: "#1f1814",
    fg: "#f8f0e8",
    muted: "#b09a8a",
    surface: "#2b221c",
    border: "#433830",
    primary: "#fb923c",
    primaryFg: "#1f1814",
  },
  {
    id: "red-dark",
    label: "レッド（暗）",
    scheme: "dark",
    swatch: "#f87171",
    bg: "#1f1414",
    fg: "#f8e8e8",
    muted: "#b08a8a",
    surface: "#2b1c1c",
    border: "#433030",
    primary: "#f87171",
    primaryFg: "#ffffff",
  },
  {
    id: "yellow-dark",
    label: "イエロー（暗）",
    scheme: "dark",
    swatch: "#facc15",
    bg: "#1a1810",
    fg: "#f8f4e0",
    muted: "#b0a88a",
    surface: "#28241c",
    border: "#403a28",
    primary: "#facc15",
    primaryFg: "#1a1810",
  },
] as const;

/** ライト＝黒枠 / ダーク＝白枠（明暗の見分け） */
function swatchRim(scheme: "light" | "dark"): string {
  return scheme === "dark" ? "#ffffff" : "#171717";
}

function packRootStyle(pack: LabThemePack): CSSProperties {
  return {
    ["--lab-bg" as string]: pack.bg,
    ["--lab-fg" as string]: pack.fg,
    ["--lab-muted" as string]: pack.muted,
    ["--lab-surface" as string]: pack.surface,
    ["--lab-border" as string]: pack.border,
    ["--lab-primary" as string]: pack.primary,
    ["--lab-primary-fg" as string]: pack.primaryFg,
    ["--lab-accent-soft" as string]: `color-mix(in oklab, ${pack.primary} 16%, ${pack.surface})`,
    // 親 lab-panel の色継承を打ち消し、選択テーマの文字・地を適用
    background: pack.bg,
    color: pack.fg,
  };
}

type LabThemeSettingsMockProps = {
  variant: LabVariantId;
  uiState?: LabUiState;
};

function LivePreview() {
  return (
    <div
      className="lab-surface flex flex-col gap-3"
      style={{ color: "var(--lab-fg)" }}
    >
      <p className="text-xs font-medium" style={{ color: "var(--lab-fg)" }}>
        プレビュー（トークン一式）
      </p>
      <p className="text-sm" style={{ color: "var(--lab-fg)" }}>
        本文サンプル。背景・文字もテーマに追従します。
      </p>
      <p className="text-xs" style={{ color: "var(--lab-muted)" }}>
        補助テキスト（muted）
      </p>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="lab-btn-primary !min-h-9 !px-3 !text-xs">
          主ボタン
        </button>
        <button type="button" className="lab-btn-secondary !min-h-9 !px-3 !text-xs">
          副ボタン
        </button>
      </div>
      <div
        className="rounded-[var(--lab-radius)] border px-2 py-1.5 text-xs"
        style={{
          borderColor: "var(--lab-border)",
          background: "var(--lab-accent-soft)",
          color: "var(--lab-fg)",
        }}
      >
        カード面・枠線も同じパック
      </div>
    </div>
  );
}

function SwatchGrid({
  selectedId,
  onSelect,
  large,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  large?: boolean;
}) {
  const size = large ? "h-11 w-11" : "h-8 w-8";
  return (
    <ul className="flex flex-wrap gap-2" role="listbox" aria-label="テーマ色">
      {LAB_THEME_PACKS.map((pack) => {
        const active = pack.id === selectedId;
        const rim = swatchRim(pack.scheme);
        return (
          <li key={pack.id}>
            <button
              type="button"
              role="option"
              aria-selected={active}
              aria-label={`${pack.label}（${pack.scheme === "dark" ? "ダーク" : "ライト"}）`}
              title={`${pack.label} · ${pack.scheme === "dark" ? "枠白＝ダーク" : "枠黒＝ライト"}`}
              className={`${size} rounded-full border-2 transition-[transform,box-shadow] duration-[var(--lab-motion)] ease-out`}
              style={{
                background: pack.swatch,
                borderColor: rim,
                boxShadow: active
                  ? `0 0 0 2px ${pack.primary}, 0 0 0 4px ${rim}`
                  : undefined,
                transform: active ? "scale(1.06)" : undefined,
              }}
              onClick={() => onSelect(pack.id)}
            />
          </li>
        );
      })}
    </ul>
  );
}

/**
 * /settings/theme の Lab 見本。A/B/C は配置差。色は全案でトークン一式プレビュー。
 */
export default function LabThemeSettingsMock({
  variant,
  uiState = "default",
}: LabThemeSettingsMockProps) {
  const [themeId, setThemeId] = useState("default");
  const pack =
    LAB_THEME_PACKS.find((p) => p.id === themeId) ?? LAB_THEME_PACKS[0];

  if (uiState === "loading") {
    return (
      <div className="flex flex-col gap-3 p-1" style={packRootStyle(pack)}>
        <div className="h-6 w-1/3 animate-pulse rounded bg-[var(--lab-accent-soft)]" />
        <div className="h-24 animate-pulse rounded-[var(--lab-radius)] bg-[var(--lab-accent-soft)]" />
        <div className="flex gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-8 w-8 animate-pulse rounded-full bg-[var(--lab-accent-soft)]"
            />
          ))}
        </div>
      </div>
    );
  }

  if (uiState === "error") {
    return (
      <div className="flex flex-col gap-3 p-1" style={packRootStyle(pack)}>
        <p className="text-sm font-medium" style={{ color: "var(--lab-fg)" }}>
          テーマ
        </p>
        <p
          className="rounded-[var(--lab-radius)] border px-3 py-2 text-sm"
          style={{
            borderColor: "var(--lab-border)",
            background: "var(--lab-surface)",
            color: "var(--lab-fg)",
          }}
        >
          テーマの読み込みに失敗しました。再試行してください。
        </p>
        <button type="button" className="lab-btn-primary w-full sm:max-w-xs">
          再試行
        </button>
      </div>
    );
  }

  if (uiState === "empty") {
    return (
      <div className="flex flex-col gap-3 p-1" style={packRootStyle(pack)}>
        <p className="text-sm font-medium" style={{ color: "var(--lab-fg)" }}>
          テーマ
        </p>
        <p className="text-xs" style={{ color: "var(--lab-muted)" }}>
          選べるテーマがありません（見本用の空状態）。
        </p>
      </div>
    );
  }

  const savedHint =
    uiState === "success" ? (
      <p className="text-xs font-medium" style={{ color: "var(--lab-primary)" }}>
        保存しました
      </p>
    ) : (
      <p className="text-xs" style={{ color: "var(--lab-muted)" }}>
        選択中: {pack.label}
      </p>
    );

  /* A: 最短 — プレビュー上、スウォッチ密、説明最小 */
  if (variant === "a") {
    return (
      <div
        className="flex flex-col gap-[var(--lab-gap)] p-1 text-sm"
        style={packRootStyle(pack)}
        data-lab-theme-mock={pack.id}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="font-semibold" style={{ color: "var(--lab-fg)" }}>
              テーマ
            </p>
            {savedHint}
          </div>
          <button type="button" className="lab-btn-secondary !min-h-8 !px-2 !text-xs">
            戻る
          </button>
        </div>
        <LivePreview />
        <SwatchGrid selectedId={themeId} onSelect={setThemeId} />
        <p className="text-[10px]" style={{ color: "var(--lab-muted)" }}>
          枠黒＝ライト / 枠白＝ダーク。タップで全体の色が変わります。
        </p>
      </div>
    );
  }

  /* B: 遊び — 大きな丸、余白、見出し強め（採用案） */
  if (variant === "b") {
    return (
      <div
        className="flex flex-col gap-[var(--lab-gap)] p-1 text-sm"
        style={packRootStyle(pack)}
        data-lab-theme-mock={pack.id}
      >
        <p
          className="text-[10px] font-medium uppercase tracking-wide"
          style={{ color: "var(--lab-muted)" }}
        >
          ← 設定
        </p>
        <div>
          <p
            className="text-lg font-semibold tracking-tight"
            style={{ color: "var(--lab-fg)" }}
          >
            自分の色にする
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--lab-muted)" }}>
            選ぶと画面の色がまとめて変わります。既定は緑です。枠の黒／白で明暗が分かります。
          </p>
        </div>
        <div
          className="flex min-h-[5.5rem] items-end rounded-[var(--lab-photo-radius)] p-3"
          style={{
            background: `linear-gradient(145deg, var(--lab-accent-soft), transparent 55%), linear-gradient(320deg, color-mix(in oklab, var(--lab-primary) 40%, ${
              pack.scheme === "dark" ? pack.surface : "#ffffff"
            }), var(--lab-border))`,
          }}
        >
          <span
            className="rounded-full px-3 py-1 text-xs font-medium shadow-sm"
            style={{
              background: "color-mix(in oklab, var(--lab-surface) 92%, transparent)",
              color: "var(--lab-fg)",
            }}
          >
            {pack.label}
          </span>
        </div>
        <SwatchGrid selectedId={themeId} onSelect={setThemeId} large />
        <LivePreview />
        {savedHint}
      </div>
    );
  }

  /* C: ブランド整合 — セクション見出し、現在のテーマ、グリッド+ラベル */
  return (
    <div
      className="flex flex-col gap-[var(--lab-gap)] p-1 text-sm"
      style={packRootStyle(pack)}
      data-lab-theme-mock={pack.id}
    >
      <div>
        <p className="text-xs underline-offset-2" style={{ color: "var(--lab-primary)" }}>
          ← 設定
        </p>
        <h2
          className="mt-2 text-base font-semibold tracking-tight"
          style={{ color: "var(--lab-fg)" }}
        >
          テーマ
        </h2>
        <p
          className="mt-1 text-xs leading-relaxed"
          style={{ color: "var(--lab-muted)" }}
        >
          テーマを選ぶと部品の色トークン全体が切り替わります。枠黒＝ライト、枠白＝ダーク。
        </p>
      </div>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium" style={{ color: "var(--lab-muted)" }}>
          いまの見た目
        </h3>
        <LivePreview />
        {savedHint}
      </section>

      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-medium" style={{ color: "var(--lab-muted)" }}>
          テーマを選ぶ
        </h3>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {LAB_THEME_PACKS.map((p) => {
            const active = p.id === themeId;
            const rim = swatchRim(p.scheme);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={active}
                  className="flex w-full items-center gap-3 rounded-[var(--lab-radius)] border px-3 py-2 text-left transition-[box-shadow] duration-[var(--lab-motion)]"
                  style={{
                    borderColor: "var(--lab-border)",
                    background: "var(--lab-surface)",
                    color: "var(--lab-fg)",
                    boxShadow: active ? `0 0 0 2px ${p.primary}` : undefined,
                  }}
                  onClick={() => setThemeId(p.id)}
                >
                  <span
                    className="h-8 w-8 shrink-0 rounded-full border-2"
                    style={{ background: p.swatch, borderColor: rim }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-medium">
                      {p.label}
                    </span>
                    {active ? (
                      <span
                        className="text-[10px]"
                        style={{ color: "var(--lab-muted)" }}
                      >
                        選択中
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
