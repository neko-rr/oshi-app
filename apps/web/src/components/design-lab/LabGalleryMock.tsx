"use client";

import type { CSSProperties } from "react";
import type { LabUiState, LabVariantId } from "@/components/design-lab/lab-meta";

type Props = {
  variant: LabVariantId;
  uiState?: LabUiState;
  mode: "gallery" | "gallery-detail";
};

const MOCK_ITEMS = [
  { name: "缶バッジ セット", cat: "缶バッジ", place: "棚A" },
  { name: "アクスタ 夏公演", cat: "アクスタ", place: "箱" },
  { name: "クリアファイル", cat: "紙類", place: "ファイル" },
  { name: "タオル", cat: "布", place: "引き出し" },
  { name: "キーホルダー", cat: "ガチャ", place: "ポーチ" },
  { name: "ブロマイド", cat: "紙類", place: "アルバム" },
] as const;

const CHIPS = ["すべて", "缶バッジ", "アクスタ", "紙類", "棚A"] as const;

function ChipRow({ active = 0 }: { active?: number }) {
  return (
    <div className="flex flex-wrap gap-1.5" role="list" aria-label="絞り込み">
      {CHIPS.map((label, i) => (
        <span
          key={label}
          role="listitem"
          className={
            i === active
              ? "rounded-full bg-[var(--lab-primary)] px-2.5 py-1 text-[10px] font-medium text-[var(--lab-primary-fg)]"
              : "rounded-full border border-[var(--lab-border)] bg-[var(--lab-surface)] px-2.5 py-1 text-[10px] lab-muted"
          }
        >
          {label}
        </span>
      ))}
    </div>
  );
}

function SearchBar({ dense }: { dense?: boolean }) {
  return (
    <div
      className={`rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] ${dense ? "px-2 py-1.5" : "px-3 py-2"}`}
    >
      <p className="text-[10px] lab-muted">グッズ名・タグで検索</p>
    </div>
  );
}

function PhotoBlock({ tall }: { tall?: boolean }) {
  return (
    <div
      className={`lab-photo w-full ${tall ? "aspect-[4/5]" : "aspect-square"}`}
      aria-hidden
    />
  );
}

function LoadMore({ label = "もっと見る" }: { label?: string }) {
  return (
    <button
      type="button"
      className="lab-btn-primary mt-2 w-full !min-h-10 text-xs sm:max-w-xs sm:self-center"
    >
      {label}
    </button>
  );
}

function GalleryListA() {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">ギャラリー</p>
        <span className="text-[10px] font-medium text-[var(--lab-primary)]">
          登録
        </span>
      </div>
      <SearchBar dense />
      <ChipRow />
      <ul className="grid grid-cols-2 gap-1.5">
        {MOCK_ITEMS.map((item) => (
          <li
            key={item.name}
            className="overflow-hidden rounded-md border border-[var(--lab-border)] bg-[var(--lab-surface)]"
          >
            <PhotoBlock />
            <div className="space-y-0.5 p-1.5">
              <p className="truncate text-[10px] font-medium">{item.name}</p>
              <p className="truncate text-[9px] lab-muted">
                {item.cat} · {item.place}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <LoadMore />
    </div>
  );
}

function GalleryListB() {
  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="text-base font-semibold tracking-tight">わたしのコレクション</p>
        <p className="lab-muted mt-0.5 text-[10px]">写真をひらいて、推しの記憶をつなぐ</p>
      </div>
      <SearchBar />
      <ChipRow active={1} />
      <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
        {MOCK_ITEMS.map((item) => (
          <li key={item.name} className="group">
            <div
              className="overflow-hidden rounded-xl bg-[var(--lab-surface)] shadow-sm ring-1 ring-[var(--lab-border)] transition duration-200"
              style={
                {
                  animation: "lab-fade-in 0.35s ease-out",
                } as CSSProperties
              }
            >
              <PhotoBlock tall />
              <div className="p-2">
                <p className="truncate text-[11px] font-medium">{item.name}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  <span className="rounded-full bg-[var(--lab-accent-soft)] px-1.5 py-0.5 text-[9px] text-[var(--lab-primary)]">
                    {item.cat}
                  </span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
      <LoadMore label="もっと見る" />
    </div>
  );
}

function GalleryListC() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">ギャラリー</p>
          <p className="lab-muted text-[10px]">登録したグッズの一覧</p>
        </div>
        <button type="button" className="lab-btn-primary !min-h-9 !px-3 text-[11px]">
          登録する
        </button>
      </div>
      <SearchBar />
      <ChipRow />
      <ul className="grid gap-3 sm:grid-cols-2">
        {MOCK_ITEMS.slice(0, 4).map((item) => (
          <li
            key={item.name}
            className="overflow-hidden rounded-[var(--lab-radius)] border border-[var(--lab-border)] bg-[var(--lab-surface)]"
          >
            <PhotoBlock />
            <div className="p-3">
              <p className="truncate text-xs font-medium">{item.name}</p>
              <p className="lab-muted mt-1 text-[10px]">
                {item.cat} · {item.place}
              </p>
            </div>
          </li>
        ))}
      </ul>
      <LoadMore />
    </div>
  );
}

function DetailA() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-[10px] font-medium text-[var(--lab-primary)]">
        ← ギャラリー（絞込維持）
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        <PhotoBlock />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold">缶バッジ セット</p>
          <ChipRow active={1} />
          <div className="rounded-md border border-[var(--lab-border)] bg-[var(--lab-surface)] p-2">
            <p className="text-[10px] font-medium">編集（優先）</p>
            <p className="lab-muted mt-1 text-[9px]">名前・メモ・タグをすぐ変更</p>
            <button type="button" className="lab-btn-primary mt-2 w-full !min-h-9 text-[11px]">
              保存
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailB() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[10px] font-medium text-[var(--lab-primary)]">
        ← ギャラリー
      </p>
      <div className="overflow-hidden rounded-2xl ring-1 ring-[var(--lab-border)]">
        <div className="lab-photo aspect-[4/5] w-full sm:aspect-[16/10]" aria-hidden />
      </div>
      <div>
        <p className="text-base font-semibold tracking-tight">缶バッジ セット</p>
        <p className="lab-muted mt-1 text-[10px]">夏公演 · 棚A</p>
      </div>
      <ChipRow active={1} />
      <details className="rounded-xl border border-[var(--lab-border)] bg-[var(--lab-surface)] p-3">
        <summary className="cursor-pointer text-xs font-medium">編集する</summary>
        <p className="lab-muted mt-2 text-[10px]">
          写真を楽しんだあと、必要なときだけ開く
        </p>
        <button type="button" className="lab-btn-primary mt-2 w-full !min-h-9 text-[11px]">
          保存
        </button>
      </details>
    </div>
  );
}

function DetailC() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-[var(--lab-primary)] underline-offset-2">
        ← ギャラリー
      </p>
      <div className="overflow-hidden rounded-[var(--lab-radius)] border border-[var(--lab-border)] bg-[var(--lab-surface)]">
        <PhotoBlock />
      </div>
      <div>
        <p className="text-sm font-semibold">缶バッジ セット</p>
        <p className="lab-muted mt-1 text-[10px]">カテゴリ・収納はチップで表示</p>
      </div>
      <div className="rounded-[var(--lab-radius)] border border-[var(--lab-border)] bg-[var(--lab-surface)] p-3">
        <p className="text-xs font-medium">詳細を編集</p>
        <p className="lab-muted mt-1 text-[10px]">基本項目とタグをセクションで整理</p>
        <button type="button" className="lab-btn-primary mt-3 !min-h-10 text-xs">
          保存する
        </button>
      </div>
    </div>
  );
}

function StateBanner({ uiState }: { uiState: LabUiState }) {
  if (uiState === "empty") {
    return (
      <div className="rounded-lg border border-dashed border-[var(--lab-border)] px-3 py-6 text-center">
        <p className="text-xs font-medium">まだグッズがありません</p>
        <p className="lab-muted mt-1 text-[10px]">登録から追加できます</p>
        <button type="button" className="lab-btn-primary mt-3 !min-h-9 text-[11px]">
          製品を登録する
        </button>
      </div>
    );
  }
  if (uiState === "loading") {
    return (
      <p className="lab-muted py-6 text-center text-xs" aria-live="polite">
        読み込み中…
      </p>
    );
  }
  if (uiState === "error") {
    return (
      <p className="rounded-md border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-xs text-red-600">
        一覧を取得できませんでした
      </p>
    );
  }
  if (uiState === "success") {
    return (
      <p className="rounded-md bg-[var(--lab-accent-soft)] px-3 py-2 text-[10px] text-[var(--lab-primary)]">
        製品を登録しました
      </p>
    );
  }
  return null;
}

export default function LabGalleryMock({
  variant,
  uiState = "default",
  mode,
}: Props) {
  if (mode === "gallery-detail") {
    if (uiState === "loading" || uiState === "error" || uiState === "empty") {
      return <StateBanner uiState={uiState} />;
    }
    if (variant === "a") return <DetailA />;
    if (variant === "b") return <DetailB />;
    return <DetailC />;
  }

  if (uiState !== "default" && uiState !== "success") {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">ギャラリー</p>
        <StateBanner uiState={uiState} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {uiState === "success" ? <StateBanner uiState="success" /> : null}
      {variant === "a" ? <GalleryListA /> : null}
      {variant === "b" ? <GalleryListB /> : null}
      {variant === "c" ? <GalleryListC /> : null}
    </div>
  );
}
