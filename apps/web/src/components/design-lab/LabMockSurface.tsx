"use client";

import type { CSSProperties, ReactNode } from "react";
import {
  LAB_OSHI_SWATCHES,
  type LabPlatformId,
  type LabSceneId,
  type LabUiState,
  type LabVariantId,
} from "@/components/design-lab/lab-meta";
import { bestButtonForeground } from "@/components/design-lab/lab-contrast";
import LabBottomTabMock from "@/components/design-lab/LabBottomTabMock";
import LabGalleryMock from "@/components/design-lab/LabGalleryMock";
import LabThemeSettingsMock from "@/components/design-lab/LabThemeSettingsMock";

type LabMockSurfaceProps = {
  variant: LabVariantId;
  platform?: LabPlatformId;
  pcWide?: boolean;
  uiState?: LabUiState;
  oshiIndex?: number;
  onOshiIndexChange?: (index: number) => void;
  scene?: LabSceneId;
};

const MOCK_ITEMS = [
  { name: "アクリルスタンド", place: "棚A-2", status: "登録済" },
  { name: "缶バッジセット", place: "ケースB", status: "写真あり" },
  { name: "ツアーTシャツ", place: "未設定", status: "要収納" },
  { name: "ペンライト", place: "引き出し", status: "登録済" },
  { name: "ポスター", place: "筒C", status: "写真あり" },
  { name: "トレカ", place: "ファイル", status: "登録済" },
] as const;

/** ログイン後シェル見本。狭幅は下部タブ、PC は上部リンク。 */
function LoggedInShell({
  platform,
  variant = "a",
  children,
}: {
  platform: LabPlatformId;
  variant?: LabVariantId;
  children: ReactNode;
}) {
  const mobile = platform !== "web-pc";
  const headerPad =
    variant === "c" ? "!py-3" : variant === "b" ? "!py-2.5" : "!py-2";

  return (
    <div className="flex min-h-0 flex-col">
      <header className={`lab-surface ${headerPad}`}>
        {mobile ? (
          <div className="flex items-center justify-between gap-2">
            <p
              className={
                variant === "c"
                  ? "text-base font-bold tracking-tight"
                  : "text-sm font-bold tracking-tight"
              }
            >
              oshi-app
            </p>
            <span className="lab-muted text-[10px]">ログアウト</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-bold tracking-tight">oshi-app</p>
            <nav
              className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px]"
              aria-label="ログイン後ナビ（見本）"
            >
              <span className="lab-muted">ホーム</span>
              <span className="font-medium text-[var(--lab-primary)]">
                ギャラリー
              </span>
              <span className="lab-muted">登録</span>
              <span className="lab-muted">検索</span>
              <span className="lab-muted">ダッシュボード</span>
              <span className="lab-muted">設定</span>
            </nav>
          </div>
        )}
      </header>
      <div
        className={
          variant === "c"
            ? "flex flex-col gap-4 p-3"
            : variant === "b"
              ? "flex flex-col gap-3 p-3"
              : "flex flex-col gap-2 p-2.5"
        }
      >
        {children}
      </div>
      {mobile ? <LabBottomTabMock variant={variant} /> : null}
    </div>
  );
}

/** スマホシェル専用シーン（タブ配置の差を主役に） */
function AppShellScene({
  variant,
  platform,
}: {
  variant: LabVariantId;
  platform: LabPlatformId;
}) {
  const mobile = platform !== "web-pc";
  return (
    <LoggedInShell platform={platform} variant={variant}>
      <div className="lab-surface !p-2.5">
        <p className="text-xs font-medium">
          {variant === "a"
            ? "用途最短: 上部はブランドのみ。主操作は下タブ。"
            : variant === "b"
              ? "推し活: 登録タブをやや強調。写真余白寄り。"
              : "ブランド整合: 余白やや広め。タブは等分で穏やか。"}
        </p>
        <p className="lab-muted mt-1 text-[10px]">
          タブ順: ギャラリー → 登録 → 検索 → その他
        </p>
        <div
          className={[
            "lab-photo mt-2 w-full",
            variant === "b" ? "aspect-[16/10]" : "aspect-[4/5]",
            mobile ? "max-h-28" : "max-h-40",
          ].join(" ")}
          aria-hidden
        />
      </div>
    </LoggedInShell>
  );
}

function StateOverlay({ uiState }: { uiState: LabUiState }) {
  if (uiState === "default") return null;
  if (uiState === "empty") {
    return (
      <div className="lab-surface text-center">
        <p className="font-medium">まだ製品がありません</p>
        <p className="lab-muted mt-1 text-xs">
          バーコードや写真から登録してみましょう
        </p>
        <button type="button" className="lab-btn-primary mt-3 w-full max-w-xs">
          最初のグッズを登録
        </button>
      </div>
    );
  }
  if (uiState === "loading") {
    return (
      <div className="lab-surface" aria-busy="true" aria-live="polite">
        <p className="text-xs font-medium">読み込み中…</p>
        <div className="mt-3 space-y-2">
          <div className="h-3 animate-pulse rounded bg-[var(--lab-accent-soft)]" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-[var(--lab-accent-soft)]" />
          <div className="lab-photo mt-2 aspect-[16/10] w-full animate-pulse opacity-70" />
        </div>
      </div>
    );
  }
  if (uiState === "error") {
    return (
      <div
        className="rounded-[var(--lab-radius)] border border-red-300/80 bg-red-50 px-3 py-3 text-xs text-red-800"
        role="alert"
      >
        <p className="font-medium">一覧を取得できませんでした</p>
        <p className="mt-1">ネットワークまたは API を確認して、再試行できます。</p>
        <button
          type="button"
          className="lab-btn-secondary mt-3 !border-red-300 !text-red-900"
        >
          再試行
        </button>
      </div>
    );
  }
  return (
    <div
      className="rounded-[var(--lab-radius)] border border-emerald-300/80 bg-emerald-50 px-3 py-3 text-xs text-emerald-900"
      role="status"
    >
      <p className="font-medium">保存しました</p>
      <p className="mt-1">ギャラリーに反映されています。</p>
    </div>
  );
}

function OshiPicker({
  oshiIndex,
  onChange,
  showSaveHint,
}: {
  oshiIndex: number;
  onChange: (i: number) => void;
  showSaveHint?: boolean;
}) {
  return (
    <div className="lab-surface flex flex-col gap-2">
      <p className="text-xs font-medium">推し色</p>
      <p className="lab-muted text-xs">
        選ぶとボタン色がすぐ変わります（全案共通）
      </p>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {LAB_OSHI_SWATCHES.map((s, i) => (
          <button
            key={s.cssVar}
            type="button"
            aria-label={`推し色 ${s.label}`}
            aria-pressed={oshiIndex === i}
            className="lab-swatch"
            data-active={oshiIndex === i}
            style={{ background: `var(${s.cssVar})` }}
            onClick={() => onChange(i)}
          />
        ))}
      </div>
      {showSaveHint ? (
        <p className="lab-muted text-[10px]">本番では保存同期あり。Lab は即時プレビュー。</p>
      ) : null}
    </div>
  );
}

type MockItem = {
  name: string;
  place: string;
  status: string;
};

function GalleryGrid({
  items,
  variant,
}: {
  items: readonly MockItem[];
  variant: LabVariantId;
}) {
  if (variant === "a") {
    return (
      <div className="lab-surface !p-0 overflow-hidden">
        <div className="border-b border-[var(--lab-border)] px-3 py-2 text-xs font-medium lab-muted">
          ギャラリー（本番に近いカード）
        </div>
        <ul className="grid gap-0 sm:grid-cols-2">
          {items.map((item) => (
            <li
              key={item.name}
              className="border-b border-[var(--lab-border)] sm:border-r"
            >
              <div className="flex gap-2 p-2">
                <div className="lab-photo h-14 w-14 shrink-0" aria-hidden />
                <div className="min-w-0 flex-1 py-0.5">
                  <p className="truncate text-xs font-medium">{item.name}</p>
                  <p className="lab-muted truncate text-[10px]">
                    {item.place} · {item.status}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (variant === "b") {
    return (
      <ul className="grid grid-cols-2 gap-2">
        {items.map((item) => (
          <li key={item.name} className="lab-surface !p-2">
            <div className="lab-photo mb-2 aspect-square w-full" aria-hidden />
            <p className="truncate text-xs font-medium">{item.name}</p>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li
          key={item.name}
          className="overflow-hidden rounded-[var(--lab-radius)] border border-[var(--lab-border)] bg-[var(--lab-surface)]"
        >
          <div className="lab-photo aspect-square w-full" aria-hidden />
          <div className="p-3">
            <p className="truncate text-xs font-medium">{item.name}</p>
            <p className="lab-muted mt-1 text-[10px]">{item.status}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function oshiStyle(oshiIndex: number): CSSProperties {
  const swatch = LAB_OSHI_SWATCHES[oshiIndex] ?? LAB_OSHI_SWATCHES[0];
  const fg = bestButtonForeground(swatch.hex);
  return {
    ["--lab-primary" as string]: `var(${swatch.cssVar})`,
    ["--lab-primary-fg" as string]: fg,
    ["--lab-accent-soft" as string]: `color-mix(in oklab, var(${swatch.cssVar}) 16%, white)`,
    ["--lab-ring" as string]: `var(${swatch.cssVar})`,
  };
}

export default function LabMockSurface({
  variant,
  platform = "web-pc",
  pcWide = false,
  uiState = "default",
  oshiIndex = 0,
  onOshiIndexChange,
  scene = "home",
}: LabMockSurfaceProps) {
  if (scene === "theme-settings") {
    return (
      <div data-lab-variant={variant}>
        <LabThemeSettingsMock variant={variant} uiState={uiState} />
      </div>
    );
  }

  if (scene === "app-shell") {
    return (
      <div data-lab-variant={variant} style={oshiStyle(oshiIndex)}>
        <AppShellScene
          variant={variant}
          platform={pcWide ? "web-pc" : platform}
        />
      </div>
    );
  }

  if (scene === "gallery" || scene === "gallery-detail") {
    return (
      <div data-lab-variant={variant} style={oshiStyle(oshiIndex)}>
        <LoggedInShell
          platform={pcWide ? "web-pc" : platform}
          variant={variant}
        >
          <LabGalleryMock
            variant={variant}
            uiState={uiState}
            mode={scene}
          />
        </LoggedInShell>
      </div>
    );
  }

  const setOshi = onOshiIndexChange ?? (() => undefined);
  const items =
    uiState === "default"
      ? pcWide
        ? MOCK_ITEMS
        : MOCK_ITEMS.slice(0, 4)
      : MOCK_ITEMS.slice(0, 4);

  const mainContent =
    uiState === "default" ? (
      <div className="flex flex-col gap-[var(--lab-gap)] text-sm">
        {variant === "a" ? (
          <>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="font-semibold">今日やること</p>
                <p className="lab-muted text-xs">未整理 1 · 登録はすぐ上</p>
              </div>
              <span className="rounded bg-[var(--lab-accent-soft)] px-2 py-0.5 text-xs font-medium text-[var(--lab-primary)]">
                要収納 1
              </span>
            </div>
            <button type="button" className="lab-btn-primary w-full sm:max-w-xs">
              グッズを登録
            </button>
          </>
        ) : null}
        {variant === "b" ? (
          <div>
            <p className="text-lg font-semibold tracking-tight">
              今日も推し活、いってみよう
            </p>
            <p className="lab-muted mt-1 text-xs">写真と推し色で自分らしく。</p>
            <button
              type="button"
              className="lab-btn-primary mt-3 w-full sm:max-w-xs"
            >
              くわしく見る
            </button>
          </div>
        ) : null}
        {variant === "c" ? (
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-base font-semibold">コレクション</p>
              <p className="lab-muted text-xs">
                グッズを登録して、収納とデータをつなぎます。
              </p>
            </div>
            <button type="button" className="lab-btn-primary !min-h-10">
              登録をはじめる
            </button>
          </div>
        ) : null}

        <GalleryGrid items={items} variant={variant} />
        <OshiPicker oshiIndex={oshiIndex} onChange={setOshi} showSaveHint />
      </div>
    ) : uiState === "success" ? (
      <div className="flex flex-col gap-3">
        <StateOverlay uiState="success" />
        <div className="opacity-70">
          <GalleryGrid items={items.slice(0, 2)} variant={variant} />
        </div>
        <OshiPicker oshiIndex={oshiIndex} onChange={setOshi} />
      </div>
    ) : (
      <div className="flex flex-col gap-3">
        <StateOverlay uiState={uiState} />
        <OshiPicker oshiIndex={oshiIndex} onChange={setOshi} />
      </div>
    );

  return (
    <div className="text-sm" style={oshiStyle(oshiIndex)}>
      <LoggedInShell
        platform={pcWide ? "web-pc" : platform}
        variant={variant}
      >
        {mainContent}
      </LoggedInShell>
    </div>
  );
}
