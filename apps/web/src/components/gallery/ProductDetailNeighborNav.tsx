"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  neighborsForId,
  readGalleryBrowseOrder,
} from "@/lib/galleryBrowseOrder";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import { galleryDetailHref } from "@/lib/galleryListQuery";
import { ChevronLeft } from "@/lib/icons";
import { cn } from "@/lib/utils";

type Props = {
  registeredProductId: number;
  listQuery: GalleryListQuery;
};

const SWIPE_MIN_PX = 64;

/**
 * 一覧の並びから隣製品へ。ボタン＋横スワイプ（ライトボックス外）。
 */
export function ProductDetailNeighborNav({
  registeredProductId,
  listQuery,
}: Props) {
  const t = useTranslations("ProductDetail");
  const router = useRouter();
  const [neighbors, setNeighbors] = useState(() =>
    neighborsForId(readGalleryBrowseOrder(), registeredProductId),
  );
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const neighborsRef = useRef(neighbors);

  useEffect(() => {
    neighborsRef.current = neighbors;
  }, [neighbors]);

  useEffect(() => {
    setNeighbors(
      neighborsForId(readGalleryBrowseOrder(), registeredProductId),
    );
  }, [registeredProductId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLElement) {
        const tag = e.target.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
        if (e.target.isContentEditable) return;
      }
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const nav = neighborsRef.current;
      if (e.key === "ArrowLeft" && nav.prev_id != null) {
        e.preventDefault();
        router.push(galleryDetailHref(nav.prev_id, listQuery));
      } else if (e.key === "ArrowRight" && nav.next_id != null) {
        e.preventDefault();
        router.push(galleryDetailHref(nav.next_id, listQuery));
      }
    }

    function onTouchStart(e: TouchEvent) {
      const touch = e.changedTouches[0];
      if (!touch) return;
      touchStartX.current = touch.clientX;
      touchStartY.current = touch.clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      const touch = e.changedTouches[0];
      const startX = touchStartX.current;
      const startY = touchStartY.current;
      touchStartX.current = null;
      touchStartY.current = null;
      if (!touch || startX == null || startY == null) return;
      if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return;
      const nav = neighborsRef.current;
      if (dx < 0 && nav.next_id != null) {
        router.push(galleryDetailHref(nav.next_id, listQuery));
      } else if (dx > 0 && nav.prev_id != null) {
        router.push(galleryDetailHref(nav.prev_id, listQuery));
      }
    }

    window.addEventListener("keydown", onKey);
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [listQuery, router]);

  if (neighbors.prev_id == null && neighbors.next_id == null) {
    return null;
  }

  function go(id: number | null) {
    if (id == null) return;
    router.push(galleryDetailHref(id, listQuery));
  }

  return (
    <div
      className="flex items-center justify-between gap-2"
      role="navigation"
      aria-label={t("neighborNav")}
    >
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="min-h-11 min-w-11"
        disabled={neighbors.prev_id == null}
        aria-label={t("prevProduct")}
        onClick={() => go(neighbors.prev_id)}
      >
        <ChevronLeft className="size-5" aria-hidden />
        <span className="sr-only sm:not-sr-only sm:ml-1">{t("prevProduct")}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={cn("min-h-11 min-w-11")}
        disabled={neighbors.next_id == null}
        aria-label={t("nextProduct")}
        onClick={() => go(neighbors.next_id)}
      >
        <span className="sr-only sm:not-sr-only sm:mr-1">{t("nextProduct")}</span>
        <ChevronLeft className="size-5 rotate-180" aria-hidden />
      </Button>
    </div>
  );
}
