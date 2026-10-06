"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import { galleryListHref } from "@/lib/galleryListQuery";
import {
  clearRecentGalleryQueries,
  fingerprintGalleryQuery,
  readRecentGalleryQueries,
  rememberRecentGalleryQuery,
  type GalleryRecentEntry,
} from "@/lib/galleryRecentQueries";
import { runAfterTick } from "@/lib/runAfterTick";

export type RecentLabelNames = {
  categories: Map<number, string>;
  storage: Map<number, string>;
  colors: Map<number, string>;
};

type Props = {
  listQuery: GalleryListQuery;
  labelNames?: RecentLabelNames;
  /** 検索ページ向け見出し */
  titleKey?: "gallery" | "search";
};

export function buildRecentQueryLabel(
  query: GalleryListQuery,
  names: RecentLabelNames | undefined,
  fallbacks: {
    search: string;
    category: string;
    storage: string;
    color: string;
  },
): string {
  const parts: string[] = [];
  if (query.q?.trim()) {
    parts.push(`${fallbacks.search}: ${query.q.trim()}`);
  }
  for (const id of query.category_tag_ids ?? []) {
    parts.push(names?.categories.get(id) ?? `${fallbacks.category}${id}`);
  }
  for (const id of query.storage_location_ids ?? []) {
    parts.push(names?.storage.get(id) ?? `${fallbacks.storage}${id}`);
  }
  for (const slot of query.color_tag_slots ?? []) {
    parts.push(names?.colors.get(slot) ?? `${fallbacks.color}${slot}`);
  }
  return parts.join(" · ") || fallbacks.search;
}

/**
 * 最近使った絞込／検索条件チップ（端末ローカル）。
 */
export function GalleryRecentFilters({
  listQuery,
  labelNames,
  titleKey = "gallery",
}: Props) {
  const t = useTranslations("Gallery");
  const tSearch = useTranslations("Search");
  const [entries, setEntries] = useState<GalleryRecentEntry[]>([]);
  const fingerprint = fingerprintGalleryQuery(listQuery);

  const fallbacks = useMemo(
    () => ({
      search: t("filterSummaryQuery"),
      category: t("category"),
      storage: t("storage"),
      color: t("color"),
    }),
    [t],
  );

  useEffect(
    () => runAfterTick(() => {
      setEntries(readRecentGalleryQueries());
    }),
    [],
  );

  useEffect(() => {
    // fingerprint 変化時だけ記録（labelNames の参照揺れを避ける）
    return runAfterTick(() => {
      const label = buildRecentQueryLabel(listQuery, labelNames, fallbacks);
      setEntries(rememberRecentGalleryQuery(listQuery, label));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fingerprint が正
  }, [fingerprint, fallbacks]);

  const title =
    titleKey === "search" ? tSearch("recentTitle") : t("recentFilters");

  if (entries.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-xs"
          onClick={() => {
            clearRecentGalleryQueries();
            setEntries([]);
          }}
        >
          {t("recentFiltersClear")}
        </Button>
      </div>
      <ul className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <li key={entry.fingerprint}>
            <Link
              href={galleryListHref({
                q: entry.query.q,
                category_tag_ids: entry.query.category_tag_ids,
                storage_location_ids: entry.query.storage_location_ids,
                color_tag_slots: entry.query.color_tag_slots,
                sort:
                  entry.query.sort === "newest" ||
                  entry.query.sort === "name" ||
                  entry.query.sort === "created_at"
                    ? entry.query.sort
                    : undefined,
              })}
              className="inline-flex min-h-9 max-w-full items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs text-foreground transition hover:bg-muted/60"
            >
              <span className="truncate">{entry.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
