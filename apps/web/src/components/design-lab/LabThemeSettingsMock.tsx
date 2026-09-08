"use client";

import { useState, type CSSProperties } from "react";
import type { LabUiState, LabVariantId } from "@/components/design-lab/lab-meta";
import {
  LAB_THEME_PACKS,
  labThemePackRootStyle,
  type LabThemePack,
} from "@/components/design-lab/lab-theme-packs";
import { LabUiCallout } from "@/components/design-lab/LabUiCallout";

export type { LabThemePack };
export { LAB_THEME_PACKS };

/** ライト＝黒枠 / ダーク＝白枠（明暗の見分け） */
function swatchRim(scheme: "light" | "dark"): string {
  return scheme === "dark" ? "#ffffff" : "#171717";
}

function packRootStyle(pack: LabThemePack): CSSProperties {
  return labThemePackRootStyle(pack) as CSSProperties;
}

type LabThemeSettingsMockProps = {
  variant: LabVariantId;
  uiState?: LabUiState;
  /** 親 Lab から既存テーマを制御するとき */
  themeId?: string;
  onThemeIdChange?: (id: string) => void;
  /** 案内 UI に会話用番号を付ける */
  showUiCallouts?: boolean;
};

function LivePreview({ showUiCallouts = false }: { showUiCallouts?: boolean }) {
  return (
    <LabUiCallout id="preview_panel" show={showUiCallouts}>
      <div
        className="lab-surface flex flex-col gap-3"
        style={{ color: "var(--lab-fg)" }}
      >
        <LabUiCallout id="preview_body" show={showUiCallouts}>
          <p className="text-xs font-medium" style={{ color: "var(--lab-fg)" }}>
            プレビュー（トークン一式）
          </p>
        </LabUiCallout>
        <p className="text-sm" style={{ color: "var(--lab-fg)" }}>
          本文サンプル。背景・文字もテーマに追従します。
        </p>
        <LabUiCallout id="preview_muted" show={showUiCallouts}>
          <p className="text-xs" style={{ color: "var(--lab-muted)" }}>
            補助テキスト（muted）
          </p>
        </LabUiCallout>
        <div className="flex flex-wrap gap-2">
          <LabUiCallout id="preview_primary" show={showUiCallouts}>
            <button
              type="button"
              className="lab-btn-primary !min-h-9 !px-3 !text-xs"
            >
              主ボタン
            </button>
          </LabUiCallout>
          <LabUiCallout id="preview_secondary" show={showUiCallouts}>
            <button
              type="button"
              className="lab-btn-secondary !min-h-9 !px-3 !text-xs"
            >
              副ボタン
            </button>
          </LabUiCallout>
        </div>
        <LabUiCallout id="preview_soft" show={showUiCallouts}>
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
        </LabUiCallout>
      </div>
    </LabUiCallout>
  );
}

function SwatchGrid({
  selectedId,
  onSelect,
  large,
  showUiCallouts = false,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  large?: boolean;
  showUiCallouts?: boolean;
}) {
  const size = large ? "h-11 w-11" : "h-8 w-8";
  return (
    <LabUiCallout id="swatches" show={showUiCallouts}>
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
    </LabUiCallout>
  );
}

/**
 * /settings/theme の Lab 見本。A/B/C は配置差。色は全案でトークン一式プレビュー。
 */
export default function LabThemeSettingsMock({
  variant,
  uiState = "default",
  themeId: themeIdProp,
  onThemeIdChange,
  showUiCallouts = false,
}: LabThemeSettingsMockProps) {
  const [themeIdLocal, setThemeIdLocal] = useState("default");
  const themeId = themeIdProp ?? themeIdLocal;
  const setThemeId = (id: string) => {
    if (onThemeIdChange) onThemeIdChange(id);
    if (themeIdProp == null) setThemeIdLocal(id);
  };
  const pack =
    LAB_THEME_PACKS.find((p) => p.id === themeId) ?? LAB_THEME_PACKS[0]!;
  const show = showUiCallouts;

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
        <LabUiCallout id="title" show={show}>
          <p className="text-sm font-medium" style={{ color: "var(--lab-fg)" }}>
            テーマ
          </p>
        </LabUiCallout>
        <LabUiCallout id="description" show={show}>
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
        </LabUiCallout>
        <LabUiCallout id="preview_primary" show={show}>
          <button type="button" className="lab-btn-primary w-full sm:max-w-xs">
            再試行
          </button>
        </LabUiCallout>
      </div>
    );
  }

  if (uiState === "empty") {
    return (
      <div className="flex flex-col gap-3 p-1" style={packRootStyle(pack)}>
        <LabUiCallout id="title" show={show}>
          <p className="text-sm font-medium" style={{ color: "var(--lab-fg)" }}>
            テーマ
          </p>
        </LabUiCallout>
        <LabUiCallout id="description" show={show}>
          <p className="text-xs" style={{ color: "var(--lab-muted)" }}>
            選べるテーマがありません（見本用の空状態）。
          </p>
        </LabUiCallout>
      </div>
    );
  }

  const savedHint =
    uiState === "success" ? (
      <LabUiCallout id="status" show={show}>
        <p
          className="text-xs font-medium"
          style={{ color: "var(--lab-primary)" }}
        >
          保存しました
        </p>
      </LabUiCallout>
    ) : (
      <LabUiCallout id="status" show={show}>
        <p className="text-xs" style={{ color: "var(--lab-muted)" }}>
          選択中: {pack.label}
        </p>
      </LabUiCallout>
    );

  if (variant === "a") {
    return (
      <div
        className="flex flex-col gap-[var(--lab-gap)] p-1 text-sm"
        style={packRootStyle(pack)}
        data-lab-theme-mock={pack.id}
      >
        <div className="flex items-center justify-between gap-2">
          <div>
            <LabUiCallout id="title" show={show}>
              <p className="font-semibold" style={{ color: "var(--lab-fg)" }}>
                テーマ
              </p>
            </LabUiCallout>
            {savedHint}
          </div>
          <LabUiCallout id="back" show={show}>
            <button
              type="button"
              className="lab-btn-secondary !min-h-8 !px-2 !text-xs"
            >
              戻る
            </button>
          </LabUiCallout>
        </div>
        <LivePreview showUiCallouts={show} />
        <SwatchGrid
          selectedId={themeId}
          onSelect={setThemeId}
          showUiCallouts={show}
        />
        <LabUiCallout id="help" show={show}>
          <p className="text-[10px]" style={{ color: "var(--lab-muted)" }}>
            枠黒＝ライト / 枠白＝ダーク。タップで全体の色が変わります。
          </p>
        </LabUiCallout>
      </div>
    );
  }

  if (variant === "b") {
    return (
      <div
        className="flex flex-col gap-[var(--lab-gap)] p-1 text-sm"
        style={packRootStyle(pack)}
        data-lab-theme-mock={pack.id}
      >
        <LabUiCallout id="back" show={show}>
          <p
            className="text-[10px] font-medium uppercase tracking-wide"
            style={{ color: "var(--lab-muted)" }}
          >
            ← 設定
          </p>
        </LabUiCallout>
        <div>
          <LabUiCallout id="title" show={show}>
            <p
              className="text-lg font-semibold tracking-tight"
              style={{ color: "var(--lab-fg)" }}
            >
              自分の色にする
            </p>
          </LabUiCallout>
          <LabUiCallout id="description" show={show}>
            <p className="mt-1 text-xs" style={{ color: "var(--lab-muted)" }}>
              選ぶと画面の色がまとめて変わります。既定は緑です。枠の黒／白で明暗が分かります。
            </p>
          </LabUiCallout>
        </div>
        <LabUiCallout id="hero" show={show}>
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
                background:
                  "color-mix(in oklab, var(--lab-surface) 92%, transparent)",
                color: "var(--lab-fg)",
              }}
            >
              {pack.label}
            </span>
          </div>
        </LabUiCallout>
        <SwatchGrid
          selectedId={themeId}
          onSelect={setThemeId}
          large
          showUiCallouts={show}
        />
        <LivePreview showUiCallouts={show} />
        {savedHint}
      </div>
    );
  }

  return (
    <div
      className="flex flex-col gap-[var(--lab-gap)] p-1 text-sm"
      style={packRootStyle(pack)}
      data-lab-theme-mock={pack.id}
    >
      <div>
        <LabUiCallout id="back" show={show}>
          <p
            className="text-xs underline-offset-2"
            style={{ color: "var(--lab-primary)" }}
          >
            ← 設定
          </p>
        </LabUiCallout>
        <LabUiCallout id="title" show={show}>
          <h2
            className="mt-2 text-base font-semibold tracking-tight"
            style={{ color: "var(--lab-fg)" }}
          >
            テーマ
          </h2>
        </LabUiCallout>
        <LabUiCallout id="description" show={show}>
          <p
            className="mt-1 text-xs leading-relaxed"
            style={{ color: "var(--lab-muted)" }}
          >
            テーマを選ぶと部品の色トークン全体が切り替わります。枠黒＝ライト、枠白＝ダーク。
          </p>
        </LabUiCallout>
      </div>

      <LabUiCallout id="section_current" show={show}>
        <section className="flex flex-col gap-2">
          <h3
            className="text-xs font-medium"
            style={{ color: "var(--lab-muted)" }}
          >
            いまの見た目
          </h3>
          <LivePreview showUiCallouts={show} />
          {savedHint}
        </section>
      </LabUiCallout>

      <LabUiCallout id="section_pick" show={show}>
        <section className="flex flex-col gap-2">
          <h3
            className="text-xs font-medium"
            style={{ color: "var(--lab-muted)" }}
          >
            テーマを選ぶ
          </h3>
          <LabUiCallout id="swatches" show={show}>
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
                        boxShadow: active
                          ? `0 0 0 2px ${p.primary}`
                          : undefined,
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
          </LabUiCallout>
        </section>
      </LabUiCallout>
    </div>
  );
}
