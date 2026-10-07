"use client";

import { useEffect, useState } from "react";
import {
  DEFAULT_MASCOT_ID,
  MASCOT_LOADING_FRAME_MS,
  resolveLoadingSilhouetteUrls,
  resolveNavPendingSilhouetteUrl,
  type MascotId,
} from "@/lib/mascotCatalog";
import { readLocalMascotId } from "@/lib/mascotPrefs";
import { runAfterTick } from "@/lib/runAfterTick";
import { cn } from "@/lib/utils";

type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "size-5",
  md: "size-24 sm:size-28",
  lg: "size-36 sm:size-44",
};

type SilhouetteProps = {
  src: string;
  size: Size;
  className?: string;
  /** 弱い脈動（待ち中）。reduced-motion では付けない */
  pulse?: boolean;
};

/**
 * PNG をテーマ色の単色シルエットにする（muted-foreground）。
 */
export function SilhouetteMask({
  src,
  size,
  className,
  pulse = false,
}: SilhouetteProps) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 bg-muted-foreground/55",
        SIZE_CLASS[size],
        pulse && "motion-safe:animate-pulse",
        className,
      )}
      style={{
        WebkitMaskImage: `url(${src})`,
        maskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}

type RouteMarkProps = {
  className?: string;
};

/**
 * ルート待ち用。設定キャラの loading 場面をシルエット表示。
 * reduced-motion 時は先頭フレームのみ。
 */
export function MascotLoadingSilhouette({ className }: RouteMarkProps) {
  const [mascotId, setMascotId] = useState<MascotId>(DEFAULT_MASCOT_ID);
  const [frameIndex, setFrameIndex] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    return runAfterTick(() => {
      setMascotId(readLocalMascotId());
      setReduceMotion(
        window.matchMedia("(prefers-reduced-motion: reduce)").matches,
      );
    });
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setReduceMotion(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const frames = resolveLoadingSilhouetteUrls(mascotId);
  const frameCount = frames.length;
  const active =
    frames[Math.min(frameIndex, Math.max(frameCount - 1, 0))] ?? frames[0];

  useEffect(() => {
    if (reduceMotion || frameCount <= 1) return;
    let intervalId = 0;
    let cancelled = false;
    const cancelStart = runAfterTick(() => {
      if (cancelled) return;
      setFrameIndex(0);
      intervalId = window.setInterval(() => {
        setFrameIndex((i) => (i + 1) % frameCount);
      }, MASCOT_LOADING_FRAME_MS);
    });
    return () => {
      cancelled = true;
      cancelStart();
      if (intervalId) window.clearInterval(intervalId);
    };
  }, [mascotId, frameCount, reduceMotion]);

  if (!active) return null;

  return (
    <SilhouetteMask
      src={active}
      size="lg"
      pulse={reduceMotion || frameCount <= 1}
      className={className}
    />
  );
}

type NavMarkProps = {
  className?: string;
};

/** ナビ pending 用の小さなシルエット顔 */
export function MascotNavPendingSilhouette({ className }: NavMarkProps) {
  const [src, setSrc] = useState("/brand/logo.png");

  useEffect(() => {
    return runAfterTick(() => {
      setSrc(resolveNavPendingSilhouetteUrl(readLocalMascotId()));
    });
  }, []);

  return <SilhouetteMask src={src} size="sm" pulse className={className} />;
}
