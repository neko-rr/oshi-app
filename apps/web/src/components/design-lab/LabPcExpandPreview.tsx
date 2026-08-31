"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import LabMockSurface from "@/components/design-lab/LabMockSurface";
import {
  labCvdFilterCss,
  type LabCvdModeId,
} from "@/components/design-lab/lab-cvd";
import {
  LAB_VARIANTS,
  type LabUiState,
  type LabVariantId,
} from "@/components/design-lab/lab-meta";
import {
  LAB_TEXT_SCALES,
  labComposePreviewFilters,
  type LabAmbientId,
  type LabTextScaleId,
} from "@/components/design-lab/lab-ux-preview";

const MIN_WIDTH = 768;
const PRESETS = [768, 1024, 1280, 1440] as const;

type LabPcExpandPreviewProps = {
  open: boolean;
  onClose: () => void;
  initialVariant?: LabVariantId;
  uiState?: LabUiState;
  oshiIndex?: number;
  onOshiIndexChange?: (index: number) => void;
  cvdMode?: LabCvdModeId;
  ambient?: LabAmbientId;
  textScale?: LabTextScaleId;
};

/**
 * Web・PC 専用。全画面で幅を変えながら、本番に近い広いレイアウトの振る舞いを確認する。
 */
export default function LabPcExpandPreview({
  open,
  onClose,
  initialVariant = "a",
  uiState = "default",
  oshiIndex = 0,
  onOshiIndexChange,
  cvdMode = "none",
  ambient = "none",
  textScale = "normal",
}: LabPcExpandPreviewProps) {
  const titleId = useId();
  const [variant, setVariant] = useState<LabVariantId>(initialVariant);
  const [widthPx, setWidthPx] = useState(1280);
  const [maxWidth, setMaxWidth] = useState(1280);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const previewFilter = labComposePreviewFilters(
    labCvdFilterCss(cvdMode),
    ambient,
  );
  const textPct =
    (LAB_TEXT_SCALES.find((t) => t.id === textScale)?.scale ?? 1) * 100;

  useEffect(() => {
    if (!open) return;
    setVariant(initialVariant);
    const updateMax = () => {
      const next = Math.max(MIN_WIDTH, window.innerWidth - 48);
      setMaxWidth(next);
      setWidthPx((w) => Math.min(Math.max(w, MIN_WIDTH), next));
    };
    updateMax();
    window.addEventListener("resize", updateMax);
    return () => window.removeEventListener("resize", updateMax);
  }, [open, initialVariant]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  const clampWidth = useCallback(
    (n: number) => Math.min(maxWidth, Math.max(MIN_WIDTH, Math.round(n))),
    [maxWidth],
  );

  const onHandlePointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startW: widthPx };
  };

  const onHandlePointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    setWidthPx(clampWidth(dragRef.current.startW + dx));
  };

  const onHandlePointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  if (!open) return null;

  const meta = LAB_VARIANTS.find((v) => v.id === variant)!;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-zinc-900/80"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-700 bg-zinc-950 px-4 py-3 text-zinc-100">
        <div className="min-w-0 flex-1">
          <p id={titleId} className="text-sm font-semibold">
            Web・PC 拡大プレビュー
          </p>
          <p className="text-xs text-zinc-400">
            幅を変えてレイアウトの崩れ・折り返しを確認（Esc で閉じる）
          </p>
        </div>

        <div
          className="flex flex-wrap gap-1"
          role="group"
          aria-label="比較案"
        >
          {LAB_VARIANTS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={variant === v.id}
              onClick={() => setVariant(v.id)}
              className={
                variant === v.id
                  ? "rounded-md bg-white px-2.5 py-1 text-xs font-medium text-zinc-900"
                  : "rounded-md px-2.5 py-1 text-xs text-zinc-300 hover:bg-zinc-800"
              }
            >
              {v.title}
            </button>
          ))}
        </div>

        <label className="flex items-center gap-2 text-xs text-zinc-300">
          <span className="whitespace-nowrap">幅 {widthPx}px</span>
          <input
            type="range"
            min={MIN_WIDTH}
            max={maxWidth}
            value={widthPx}
            onChange={(e) => setWidthPx(clampWidth(Number(e.target.value)))}
            className="w-40 accent-white"
            aria-label="プレビュー幅"
          />
        </label>

        <div className="flex flex-wrap gap-1">
          {PRESETS.filter((p) => p <= maxWidth).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setWidthPx(p)}
              className="rounded border border-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
            >
              {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setWidthPx(maxWidth)}
            className="rounded border border-zinc-600 px-2 py-0.5 text-[10px] text-zinc-300 hover:bg-zinc-800"
          >
            最大
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-white"
        >
          閉じる
        </button>
      </div>

      <div className="flex min-h-0 flex-1 justify-center overflow-auto p-4">
        <div
          className="relative flex shrink-0 flex-col"
          style={{
            width: widthPx,
            ...(previewFilter ? { filter: previewFilter } : {}),
          }}
          data-lab-cvd={cvdMode}
          data-lab-ambient={ambient}
        >
          <div
            data-lab-variant={variant}
            className="lab-panel flex min-h-[70vh] flex-col overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-2 border-b border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2">
              <span className="size-2 rounded-full bg-zinc-300" aria-hidden />
              <span className="size-2 rounded-full bg-zinc-300" aria-hidden />
              <span className="size-2 rounded-full bg-zinc-300" aria-hidden />
              <span className="ml-2 flex-1 truncate rounded bg-[var(--lab-accent-soft)] px-2 py-1 text-[11px] lab-muted">
                oshi-app · {meta.title} · {widthPx}px
              </span>
            </div>
            <div className="border-b border-[var(--lab-border)] px-4 py-2 text-xs lab-muted">
              {meta.subtitle} — PC 幅での配置・折り返しを確認
            </div>
            <div
              className="flex-1 overflow-y-auto p-4 sm:p-6"
              style={
                textPct !== 100 ? { fontSize: `${textPct}%` } : undefined
              }
              data-lab-text-scale={textScale}
            >
              <div className="mx-auto w-full max-w-5xl">
                <LabMockSurface
                  variant={variant}
                  platform="web-pc"
                  pcWide
                  uiState={uiState}
                  oshiIndex={oshiIndex}
                  onOshiIndexChange={onOshiIndexChange}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            aria-label="幅をドラッグして変更"
            className="absolute top-0 -right-3 bottom-0 z-10 w-3 cursor-ew-resize touch-none rounded-r bg-zinc-500/40 hover:bg-sky-400/70"
            onPointerDown={onHandlePointerDown}
            onPointerMove={onHandlePointerMove}
            onPointerUp={onHandlePointerUp}
            onPointerCancel={onHandlePointerUp}
          />
        </div>
      </div>
    </div>
  );
}
