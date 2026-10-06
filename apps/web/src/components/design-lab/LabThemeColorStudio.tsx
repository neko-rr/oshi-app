"use client";

import { Link } from "@/i18n/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { LAB_THEME_PACKS, findLabThemePack, type LabThemePack } from "@/components/design-lab/lab-theme-packs";
import LabCvdFilters from "@/components/design-lab/LabCvdFilters";
import {
  LAB_CVD_MODES,
  labCvdFilterCss,
  type LabCvdModeId,
} from "@/components/design-lab/lab-cvd";
import {
  SCALE_STEPS,
  buildPreviewPackFromLabTheme,
  buildPreviewPackFromSeed,
  generateBrandScale,
  listSemanticContrasts,
  type ThemePreviewPack,
  type ThemePreviewScheme,
} from "@/lib/themeColorScale";
import { normalizeHex } from "@/lib/oshiContrast";
import { runAfterTick } from "@/lib/runAfterTick";

type PreviewTabId =
  | "components"
  | "cards"
  | "dashboard"
  | "gallery"
  | "shadcn";

type StudioMode = "catalog" | "explore";
type CatalogFilter = "all" | "light" | "dark";

const PREVIEW_TABS: { id: PreviewTabId; label: string; hint: string }[] = [
  { id: "components", label: "Components", hint: "ボタン・入力・チップ" },
  { id: "cards", label: "Cards", hint: "情報カードの面と枠" },
  { id: "dashboard", label: "Dashboard", hint: "一覧・統計の地" },
  { id: "gallery", label: "Gallery", hint: "写真主役＋色の合図" },
  { id: "shadcn", label: "Shadcn/ui", hint: "本番部品に近い形" },
];

const DEFAULT_PACK_ID = "default";

function packCssVars(pack: ThemePreviewPack): CSSProperties {
  return {
    ["--lab-bg" as string]: pack.bg,
    ["--lab-fg" as string]: pack.fg,
    ["--lab-muted" as string]: pack.muted,
    ["--lab-surface" as string]: pack.surface,
    ["--lab-border" as string]: pack.border,
    ["--lab-primary" as string]: pack.primary,
    ["--lab-primary-fg" as string]: pack.primaryFg,
    ["--lab-soft" as string]: pack.soft,
    ["--lab-destructive" as string]: pack.destructive,
    ["--lab-destructive-fg" as string]: pack.destructiveFg,
    background: pack.bg,
    color: pack.fg,
  };
}

function tryNormalize(raw: string): string | null {
  try {
    return normalizeHex(raw);
  } catch {
    return null;
  }
}

function copyText(text: string): void {
  void navigator.clipboard?.writeText(text);
}

function ScaleStrip({
  scale,
  seed,
}: {
  scale: ThemePreviewPack["scale"];
  seed: string;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-zinc-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Brand scale</h2>
          <p className="text-xs text-zinc-500">
            50–950 · シードは 500（{seed}）。本番反映は colors.css を人手で。
          </p>
        </div>
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11">
        {SCALE_STEPS.map((step) => {
          const hex = scale[step];
          const isSeed = step === 500;
          return (
            <li key={step} className="min-w-0">
              <button
                type="button"
                title={`${step}: ${hex}（クリックでコピー）`}
                className="group flex w-full flex-col text-left"
                onClick={() => copyText(hex)}
              >
                <span
                  className={
                    isSeed
                      ? "h-20 ring-2 ring-inset ring-zinc-900/40"
                      : "h-16"
                  }
                  style={{ backgroundColor: hex }}
                />
                <span className="flex flex-col gap-0.5 px-2 py-2">
                  <span className="text-[11px] font-medium text-zinc-800">
                    {step}
                    {isSeed ? " · seed" : ""}
                  </span>
                  <span className="truncate font-mono text-[10px] text-zinc-500 group-hover:text-zinc-800">
                    {hex}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function ContrastPanel({ pack }: { pack: ThemePreviewPack }) {
  const rows = listSemanticContrasts(pack);
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">コントラスト（AA 目安）</h2>
      <p className="mt-1 text-xs text-zinc-500">
        WCAG 本文 4.5:1。診断ではなく Lab の目安です。
      </p>
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-zinc-100 px-3 py-2 text-xs"
          >
            <span className="font-medium text-zinc-800">{row.label}</span>
            <span className="flex items-center gap-2">
              <span
                className="inline-flex h-6 min-w-10 items-center justify-center rounded px-2 font-mono"
                style={{ backgroundColor: row.bg, color: row.fg }}
              >
                Aa
              </span>
              <span
                className={
                  row.aa_ok
                    ? "rounded-full bg-emerald-100 px-2 py-0.5 font-medium text-emerald-900"
                    : "rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-950"
                }
              >
                {row.ratio.toFixed(2)}:1 {row.aa_ok ? "AA" : "要調整"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function SemanticSwatches({ pack }: { pack: ThemePreviewPack }) {
  const items: { label: string; hex: string }[] = [
    { label: "background", hex: pack.bg },
    { label: "foreground", hex: pack.fg },
    { label: "muted", hex: pack.muted },
    { label: "card / surface", hex: pack.surface },
    { label: "border", hex: pack.border },
    { label: "primary", hex: pack.primary },
    { label: "soft / accent", hex: pack.soft },
    { label: "destructive", hex: pack.destructive },
  ];
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">セマンティック役割</h2>
      <p className="mt-1 text-xs text-zinc-500">
        本番は themes.md のトークン一式。ここはシードから仮生成した見本です。
      </p>
      <ul className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {items.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className="flex w-full items-center gap-2 rounded-lg border border-zinc-100 p-2 text-left hover:bg-zinc-50"
              onClick={() => copyText(item.hex)}
              title="クリックでコピー"
            >
              <span
                className="size-8 shrink-0 rounded-md border border-zinc-200"
                style={{ backgroundColor: item.hex }}
              />
              <span className="min-w-0">
                <span className="block truncate text-[11px] font-medium text-zinc-800">
                  {item.label}
                </span>
                <span className="block truncate font-mono text-[10px] text-zinc-500">
                  {item.hex}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PreviewChrome({
  pack,
  children,
  title,
}: {
  pack: ThemePreviewPack;
  children: ReactNode;
  title: string;
}) {
  return (
    <div
      className="overflow-hidden rounded-2xl border border-zinc-300 shadow-md"
      style={packCssVars(pack)}
    >
      <div
        className="flex items-center justify-between border-b px-3 py-2 text-[11px]"
        style={{
          borderColor: "var(--lab-border)",
          background: "var(--lab-surface)",
          color: "var(--lab-muted)",
        }}
      >
        <span className="font-medium" style={{ color: "var(--lab-fg)" }}>
          {title}
        </span>
        <span>{pack.scheme === "dark" ? "ダーク見本" : "ライト見本"}</span>
      </div>
      <div className="p-4" style={{ background: "var(--lab-bg)" }}>
        {children}
      </div>
    </div>
  );
}

function ComponentsPreview() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium" style={{ color: "var(--lab-fg)" }}>
        推し活グッズを登録
      </p>
      <p className="text-xs" style={{ color: "var(--lab-muted)" }}>
        主CTAは primary。副アクションは枠のみ。削除は destructive。
      </p>
      <label className="flex flex-col gap-1 text-xs" style={{ color: "var(--lab-fg)" }}>
        グッズ名
        <input
          readOnly
          defaultValue="アクリルスタンド"
          className="rounded-md border px-3 py-2 text-sm outline-none"
          style={{
            borderColor: "var(--lab-border)",
            background: "var(--lab-surface)",
            color: "var(--lab-fg)",
          }}
        />
      </label>
      <div className="flex flex-wrap gap-2">
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-medium"
          style={{
            background: "var(--lab-soft)",
            color: "var(--lab-fg)",
          }}
        >
          選択中チップ
        </span>
        <span
          className="rounded-full border px-2.5 py-1 text-[11px]"
          style={{
            borderColor: "var(--lab-border)",
            color: "var(--lab-muted)",
          }}
        >
          未選択
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="rounded-md px-4 py-2 text-sm font-medium"
          style={{
            background: "var(--lab-primary)",
            color: "var(--lab-primary-fg)",
          }}
        >
          保存する
        </button>
        <button
          type="button"
          className="rounded-md border px-4 py-2 text-sm"
          style={{
            borderColor: "var(--lab-border)",
            background: "var(--lab-surface)",
            color: "var(--lab-fg)",
          }}
        >
          キャンセル
        </button>
        <button
          type="button"
          className="rounded-md px-4 py-2 text-sm font-medium"
          style={{
            background: "var(--lab-destructive)",
            color: "var(--lab-destructive-fg)",
          }}
        >
          削除
        </button>
      </div>
    </div>
  );
}

function CardsPreview() {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {[1, 2].map((n) => (
        <article
          key={n}
          className="rounded-xl border p-3"
          style={{
            borderColor: "var(--lab-border)",
            background: "var(--lab-surface)",
          }}
        >
          <p className="text-sm font-semibold" style={{ color: "var(--lab-fg)" }}>
            カード {n}
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--lab-muted)" }}>
            面は surface、地は background。枠は border。
          </p>
          <button
            type="button"
            className="mt-3 rounded-md px-3 py-1.5 text-xs font-medium"
            style={{
              background: "var(--lab-primary)",
              color: "var(--lab-primary-fg)",
            }}
          >
            開く
          </button>
        </article>
      ))}
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-3 gap-2">
        {["登録", "収納", "未分類"].map((label) => (
          <div
            key={label}
            className="rounded-lg border p-3 text-center"
            style={{
              borderColor: "var(--lab-border)",
              background: "var(--lab-surface)",
            }}
          >
            <p className="text-lg font-semibold" style={{ color: "var(--lab-fg)" }}>
              12
            </p>
            <p className="text-[10px]" style={{ color: "var(--lab-muted)" }}>
              {label}
            </p>
          </div>
        ))}
      </div>
      <div
        className="rounded-lg border px-3 py-2 text-xs"
        style={{
          borderColor: "var(--lab-border)",
          background: "var(--lab-soft)",
          color: "var(--lab-fg)",
        }}
      >
        soft 面は推し色の薄い合図。全面染めにはしない。
      </div>
    </div>
  );
}

function GalleryPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {["全部", "ライブ", "グッズ"].map((label, i) => (
          <span
            key={label}
            className="rounded-full px-2.5 py-1 text-[11px]"
            style={
              i === 0
                ? {
                    background: "var(--lab-primary)",
                    color: "var(--lab-primary-fg)",
                  }
                : {
                    border: "1px solid var(--lab-border)",
                    color: "var(--lab-muted)",
                    background: "var(--lab-surface)",
                  }
            }
          >
            {label}
          </span>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="aspect-square rounded-lg border"
            style={{
              borderColor: "var(--lab-border)",
              background:
                i % 2 === 0
                  ? "color-mix(in oklab, var(--lab-muted) 18%, var(--lab-surface))"
                  : "color-mix(in oklab, var(--lab-primary) 12%, var(--lab-surface))",
            }}
          />
        ))}
      </div>
      <p className="text-[11px]" style={{ color: "var(--lab-muted)" }}>
        写真が主役。色はチップと主CTAの合図にとどめる目安。
      </p>
    </div>
  );
}

function ShadcnPreview() {
  return (
    <div className="flex flex-col gap-3">
      <div
        className="rounded-xl border p-4 shadow-sm"
        style={{
          borderColor: "var(--lab-border)",
          background: "var(--lab-surface)",
        }}
      >
        <p className="text-sm font-semibold" style={{ color: "var(--lab-fg)" }}>
          Dialog / Sheet 風
        </p>
        <p className="mt-1 text-xs" style={{ color: "var(--lab-muted)" }}>
          本番 shadcn はセマンティック変数のみ。hex 直書きしない。
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border px-3 py-1.5 text-xs"
            style={{
              borderColor: "var(--lab-border)",
              color: "var(--lab-fg)",
            }}
          >
            Close
          </button>
          <button
            type="button"
            className="rounded-md px-3 py-1.5 text-xs font-medium"
            style={{
              background: "var(--lab-primary)",
              color: "var(--lab-primary-fg)",
            }}
          >
            Continue
          </button>
        </div>
      </div>
      <div
        className="flex items-center justify-between rounded-md border px-3 py-2 text-xs"
        style={{
          borderColor: "var(--lab-border)",
          background: "var(--lab-bg)",
          color: "var(--lab-fg)",
        }}
      >
        <span>Focus ring → primary</span>
        <span
          className="size-3 rounded-full"
          style={{
            background: "var(--lab-primary)",
            boxShadow:
              "0 0 0 2px var(--lab-bg), 0 0 0 4px var(--lab-primary)",
          }}
        />
      </div>
    </div>
  );
}

function PreviewBody({ tab }: { tab: PreviewTabId }) {
  switch (tab) {
    case "cards":
      return <CardsPreview />;
    case "dashboard":
      return <DashboardPreview />;
    case "gallery":
      return <GalleryPreview />;
    case "shadcn":
      return <ShadcnPreview />;
    default:
      return <ComponentsPreview />;
  }
}

function CatalogList({
  selectedId,
  filter,
  onFilter,
  onSelect,
}: {
  selectedId: string | null;
  filter: CatalogFilter;
  onFilter: (f: CatalogFilter) => void;
  onSelect: (pack: LabThemePack) => void;
}) {
  const items = LAB_THEME_PACKS.filter(
    (p) => filter === "all" || p.scheme === filter,
  );
  return (
    <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-zinc-100 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">
            既存テーマ一覧
          </h2>
          <p className="text-xs text-zinc-500">
            クリックで切替。名前・ID・明暗を一覧で確認できます（{LAB_THEME_PACKS.length}{" "}
            件）。
          </p>
        </div>
        <div
          className="flex flex-wrap gap-1.5"
          role="group"
          aria-label="一覧フィルタ"
        >
          {(
            [
              ["all", "すべて"],
              ["light", "ライト"],
              ["dark", "ダーク"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => onFilter(id)}
              className={
                filter === id
                  ? "rounded-full bg-zinc-900 px-2.5 py-1 text-[11px] font-medium text-white"
                  : "rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-[11px] text-zinc-700 hover:bg-zinc-50"
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <ul
        className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3"
        role="listbox"
        aria-label="既存テーマ"
      >
        {items.map((p) => {
          const active = selectedId === p.id;
          return (
            <li key={p.id}>
              <button
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelect(p)}
                className={
                  active
                    ? "flex w-full flex-col gap-2 rounded-xl border-2 border-zinc-900 bg-zinc-50 p-3 text-left shadow-sm"
                    : "flex w-full flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-3 text-left hover:border-zinc-400 hover:bg-zinc-50"
                }
              >
                <span className="flex items-center gap-2">
                  <span
                    className="size-9 shrink-0 rounded-full border-2"
                    style={{
                      backgroundColor: p.swatch,
                      borderColor: p.scheme === "dark" ? "#fff" : "#171717",
                      boxShadow:
                        p.scheme === "dark"
                          ? "0 0 0 1px #171717"
                          : undefined,
                    }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-zinc-900">
                      {p.label}
                    </span>
                    <span className="block truncate font-mono text-[10px] text-zinc-500">
                      {p.id}
                    </span>
                  </span>
                  <span
                    className={
                      p.scheme === "dark"
                        ? "shrink-0 rounded-full bg-zinc-800 px-2 py-0.5 text-[10px] font-medium text-white"
                        : "shrink-0 rounded-full border border-zinc-300 bg-white px-2 py-0.5 text-[10px] font-medium text-zinc-700"
                    }
                  >
                    {p.scheme === "dark" ? "ダーク" : "ライト"}
                  </span>
                </span>
                <span
                  className="flex h-8 overflow-hidden rounded-md border border-zinc-200"
                  aria-hidden
                >
                  <span className="w-[28%]" style={{ background: p.bg }} />
                  <span className="w-[28%]" style={{ background: p.surface }} />
                  <span className="w-[28%]" style={{ background: p.primary }} />
                  <span className="w-[16%]" style={{ background: p.fg }} />
                </span>
                <span className="font-mono text-[10px] text-zinc-500">
                  primary {p.primary}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * Design Lab 常設: UI Colors 風のテーマ色見本スタジオ。
 * 参考: https://uicolors.app/generate/790c1e
 */
export default function LabThemeColorStudio() {
  const initialPack = findLabThemePack(DEFAULT_PACK_ID) ?? LAB_THEME_PACKS[0]!;
  const [mode, setMode] = useState<StudioMode>("catalog");
  const [packId, setPackId] = useState<string>(initialPack.id);
  const [seedInput, setSeedInput] = useState(initialPack.primary);
  const [seed, setSeed] = useState(initialPack.primary);
  const [scheme, setScheme] = useState<ThemePreviewScheme>(initialPack.scheme);
  const [tab, setTab] = useState<PreviewTabId>("components");
  const [cvdMode, setCvdMode] = useState<LabCvdModeId>("none");
  const [catalogFilter, setCatalogFilter] = useState<CatalogFilter>("all");
  const [urlReady, setUrlReady] = useState(false);

  const selectedLabPack = useMemo(
    () => (mode === "catalog" ? findLabThemePack(packId) : undefined),
    [mode, packId],
  );

  const pack = useMemo(() => {
    if (mode === "catalog" && selectedLabPack) {
      return buildPreviewPackFromLabTheme(selectedLabPack);
    }
    return buildPreviewPackFromSeed(seed, scheme);
  }, [mode, selectedLabPack, seed, scheme]);

  const dualPack = useMemo(
    () =>
      buildPreviewPackFromSeed(
        pack.seed,
        pack.scheme === "light" ? "dark" : "light",
      ),
    [pack.seed, pack.scheme],
  );
  const scale = useMemo(() => generateBrandScale(pack.seed), [pack.seed]);
  const previewFilter = labCvdFilterCss(cvdMode);

  const applyCatalog = useCallback((lab: LabThemePack) => {
    setMode("catalog");
    setPackId(lab.id);
    setScheme(lab.scheme);
    setSeed(lab.primary);
    setSeedInput(lab.primary);
  }, []);

  const applyExploreSeed = useCallback((raw: string) => {
    const next = tryNormalize(raw);
    if (!next) return;
    setMode("explore");
    setPackId("");
    setSeed(next);
    setSeedInput(next);
  }, []);

  useEffect(
    () =>
      runAfterTick(() => {
        const params = new URLSearchParams(window.location.search);
        const theme = params.get("theme");
        const q = params.get("seed");
        if (theme) {
          const found = findLabThemePack(theme);
          if (found) applyCatalog(found);
        } else if (q) {
          applyExploreSeed(q);
        }
        setUrlReady(true);
      }),
    [applyCatalog, applyExploreSeed],
  );

  useEffect(() => {
    if (!urlReady) return;
    const url = new URL(window.location.href);
    if (mode === "catalog" && packId) {
      url.searchParams.set("theme", packId);
      url.searchParams.delete("seed");
    } else {
      url.searchParams.set("seed", seed.replace("#", ""));
      url.searchParams.delete("theme");
    }
    window.history.replaceState({}, "", url.toString());
  }, [mode, packId, seed, urlReady]);

  const randomSeed = () => {
    const n = Math.floor(Math.random() * 0xffffff);
    applyExploreSeed(`#${n.toString(16).padStart(6, "0")}`);
  };

  const modeLabel =
    mode === "catalog" && selectedLabPack
      ? `既存: ${selectedLabPack.label}（${selectedLabPack.id}）`
      : `色検討: ${seed}`;

  return (
    <div className="min-h-full bg-zinc-100 text-zinc-900">
      <LabCvdFilters />
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-100/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Design Lab · Theme colors
              </p>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                テーマ色見本スタジオ
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-zinc-600">
                既存テーマは一覧からクリック切替。新規色は Brand seed で検討（
                <a
                  className="font-medium text-zinc-800 underline underline-offset-2 hover:text-zinc-950"
                  href="https://uicolors.app/generate/790c1e"
                  target="_blank"
                  rel="noreferrer"
                >
                  UI Colors
                </a>
                風）。本番{" "}
                <code className="rounded bg-zinc-200 px-1 text-[11px]">
                  colors.css
                </code>{" "}
                への自動書き込みはありません。
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-800">
                いま表示中: {modeLabel}
              </p>
            </div>
            <nav className="flex flex-wrap gap-2 text-xs">
              <Link
                href="/dev/design-lab"
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 font-medium text-zinc-800 hover:bg-zinc-50"
              >
                ← 3案比較 Lab
              </Link>
              <Link
                href="/dev/design-lab/font-packs"
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
              >
                文字パック候補
              </Link>
              <Link
                href="/settings/theme"
                className="rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-zinc-700 hover:bg-zinc-50"
              >
                本番テーマ設定
              </Link>
            </nav>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1 text-xs font-medium text-zinc-700">
              Brand seed（色検討）
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  aria-label="色ピッカー"
                  value={tryNormalize(seedInput) ?? seed}
                  onChange={(e) => applyExploreSeed(e.target.value)}
                  className="h-9 w-12 cursor-pointer rounded border border-zinc-300 bg-white"
                />
                <input
                  type="text"
                  spellCheck={false}
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  onBlur={() => applyExploreSeed(seedInput)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") applyExploreSeed(seedInput);
                  }}
                  className="w-28 rounded-md border border-zinc-300 bg-white px-2 py-2 font-mono text-sm"
                  placeholder="#b8e05c"
                />
              </span>
            </label>
            <button
              type="button"
              onClick={randomSeed}
              className="rounded-full border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-800 hover:bg-zinc-50"
            >
              ランダム
            </button>
            {mode === "explore" ? (
              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label="明暗スキーム"
              >
                <span className="text-xs font-medium text-zinc-600">見本:</span>
                {(
                  [
                    ["light", "ライト"],
                    ["dark", "ダーク"],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={scheme === id}
                    onClick={() => setScheme(id)}
                    className={
                      scheme === id
                        ? "rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                        : "rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                    }
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="色覚プレビュー"
            >
              <span className="text-xs font-medium text-zinc-600">色覚:</span>
              {LAB_CVD_MODES.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={cvdMode === m.id}
                  title={m.hint}
                  onClick={() => setCvdMode(m.id)}
                  className={
                    cvdMode === m.id
                      ? "rounded-full bg-zinc-800 px-2.5 py-1 text-[11px] font-medium text-white"
                      : "rounded-full border border-zinc-300 bg-white px-2.5 py-1 text-[11px] text-zinc-700 hover:bg-zinc-50"
                  }
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main
        className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 py-4 pb-16"
        style={previewFilter ? { filter: previewFilter } : undefined}
      >
        <CatalogList
          selectedId={mode === "catalog" ? packId : null}
          filter={catalogFilter}
          onFilter={setCatalogFilter}
          onSelect={applyCatalog}
        />

        <ScaleStrip scale={scale} seed={pack.seed} />

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-3">
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="見本タブ"
            >
              {PREVIEW_TABS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  title={t.hint}
                  onClick={() => setTab(t.id)}
                  className={
                    tab === t.id
                      ? "rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                      : "rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs text-zinc-700 hover:bg-zinc-50"
                  }
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <PreviewChrome
                pack={pack}
                title={
                  mode === "catalog" && selectedLabPack
                    ? `${selectedLabPack.label} · ${PREVIEW_TABS.find((t) => t.id === tab)?.label ?? ""}`
                    : `色検討 · ${PREVIEW_TABS.find((t) => t.id === tab)?.label ?? ""}`
                }
              >
                <PreviewBody tab={tab} />
              </PreviewChrome>
              <PreviewChrome
                pack={dualPack}
                title={`対比（仮）· ${dualPack.scheme === "dark" ? "ダーク" : "ライト"}`}
              >
                <PreviewBody tab={tab} />
              </PreviewChrome>
            </div>
          </div>

          <aside className="flex flex-col gap-4">
            <SemanticSwatches pack={pack} />
            <ContrastPanel pack={pack} />
            <section className="rounded-2xl border border-zinc-200 bg-white p-4 text-xs text-zinc-600 shadow-sm">
              <h2 className="text-sm font-semibold text-zinc-900">使い方</h2>
              <ol className="mt-2 list-decimal space-y-1.5 pl-4">
                <li>上の一覧で既存テーマを選び、部品見本を確認</li>
                <li>新しい色は Brand seed で検討モードに入る</li>
                <li>AA が落ちる組み合わせはシードか明暗を変える</li>
                <li>
                  採用したらチャットで本決定 →{" "}
                  <code className="rounded bg-zinc-100 px-1">colors.css</code>{" "}
                  にトークン一式を人手反映
                </li>
              </ol>
              <p className="mt-3 text-[11px] text-zinc-500">
                URL:{" "}
                <code className="rounded bg-zinc-100 px-1">?theme=default</code>{" "}
                または{" "}
                <code className="rounded bg-zinc-100 px-1">?seed=790c1e</code>
              </p>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
