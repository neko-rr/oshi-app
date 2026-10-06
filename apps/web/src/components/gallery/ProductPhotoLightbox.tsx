"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { X } from "@/lib/icons";
import { runAfterTick } from "@/lib/runAfterTick";

type Props = {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
};

const MIN_SCALE = 1;
const MAX_SCALE = 4;

/**
 * 詳細写真のフルスクリーン閲覧。ピンチ・ダブルタップ・+/-（依存ライブラリなし）。
 */
export default function ProductPhotoLightbox({
  src,
  alt,
  open,
  onClose,
}: Props) {
  const t = useTranslations("ProductDetail");
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement | null>(null);
  const [scale, setScale] = useState(1);
  const [reduceMotion, setReduceMotion] = useState(false);
  const pointers = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; scale: number } | null>(null);
  const lastTap = useRef(0);

  useEffect(
    () =>
      runAfterTick(() => {
        setReduceMotion(
          window.matchMedia("(prefers-reduced-motion: reduce)").matches,
        );
      }),
    [],
  );

  useEffect(() => {
    if (!open) {
      return runAfterTick(() => setScale(1));
    }
    closeRef.current?.focus();
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

  const zoomBy = useCallback((delta: number) => {
    setScale((s) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s + delta)));
  }, []);

  function onPointerDown(e: ReactPointerEvent) {
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      pinchStart.current = { dist, scale };
    }
  }

  function onPointerMove(e: ReactPointerEvent) {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.current.size === 2 && pinchStart.current) {
      const pts = [...pointers.current.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const next =
        pinchStart.current.scale * (dist / Math.max(pinchStart.current.dist, 1));
      setScale(Math.min(MAX_SCALE, Math.max(MIN_SCALE, next)));
    }
  }

  function onPointerUp(e: ReactPointerEvent) {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinchStart.current = null;
  }

  function onDoubleTapToggle() {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setScale((s) => (s > 1.1 ? 1 : 2));
      lastTap.current = 0;
    } else {
      lastTap.current = now;
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col bg-black/95 text-white"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <p id={titleId} className="truncate text-sm font-medium">
          {t("lightboxTitle")}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="min-h-9"
            onClick={() => zoomBy(-0.5)}
            aria-label={t("zoomOut")}
          >
            −
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="min-h-9"
            onClick={() => zoomBy(0.5)}
            aria-label={t("zoomIn")}
          >
            +
          </Button>
          <Button
            ref={closeRef}
            type="button"
            size="sm"
            variant="secondary"
            className="min-h-9"
            onClick={onClose}
            aria-label={t("closeLightbox")}
          >
            <X className="size-4" aria-hidden />
          </Button>
        </div>
      </div>

      <div
        className="relative min-h-0 flex-1 touch-none overflow-hidden"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- signed URL */}
        <img
          src={src}
          alt={alt}
          className="mx-auto h-full max-h-full w-full max-w-full object-contain select-none"
          style={{
            transform: `scale(${scale})`,
            transition: reduceMotion ? undefined : "transform 120ms ease-out",
          }}
          draggable={false}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onClick={onDoubleTapToggle}
        />
      </div>
    </div>
  );
}
