"use client";

import Link from "next/link";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import { galleryListHref } from "@/lib/galleryListQuery";

export type GalleryFilterOption = {
  id: number;
  name: string;
};

type Props = {
  listQuery: GalleryListQuery;
  categories: GalleryFilterOption[];
  storageLocations: GalleryFilterOption[];
};

function chipClass(active: boolean): string {
  return active
    ? "inline-flex min-h-9 items-center rounded-full bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition"
    : "inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition hover:bg-muted/60";
}

export function GalleryFilterChips({
  listQuery,
  categories,
  storageLocations,
}: Props) {
  const base = {
    q: listQuery.q,
  };

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          カテゴリ
        </p>
        <div className="flex flex-wrap gap-1.5" role="list">
          <Link
            href={galleryListHref({
              ...base,
              storage_location_id: listQuery.storage_location_id,
            })}
            className={chipClass(listQuery.category_tag_id == null)}
            role="listitem"
          >
            すべて
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={galleryListHref({
                ...base,
                category_tag_id: c.id,
                storage_location_id: listQuery.storage_location_id,
              })}
              className={chipClass(listQuery.category_tag_id === c.id)}
              role="listitem"
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-muted-foreground">
          収納
        </p>
        <div className="flex flex-wrap gap-1.5" role="list">
          <Link
            href={galleryListHref({
              ...base,
              category_tag_id: listQuery.category_tag_id,
            })}
            className={chipClass(listQuery.storage_location_id == null)}
            role="listitem"
          >
            すべて
          </Link>
          {storageLocations.map((s) => (
            <Link
              key={s.id}
              href={galleryListHref({
                ...base,
                category_tag_id: listQuery.category_tag_id,
                storage_location_id: s.id,
              })}
              className={chipClass(listQuery.storage_location_id === s.id)}
              role="listitem"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
