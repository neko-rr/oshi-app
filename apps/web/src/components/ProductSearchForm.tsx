"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import { galleryListHref } from "@/lib/galleryListQuery";

type Props = {
  /** 検索送信先（既定 /search） */
  actionPath?: string;
  initialQuery?: string;
  /** ギャラリー時: 他の絞込を維持 */
  preserveFilters?: Pick<
    GalleryListQuery,
    "category_tag_id" | "storage_location_id"
  >;
};

export function ProductSearchForm({
  actionPath = "/search",
  initialQuery = "",
  preserveFilters,
}: Props) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = q.trim();
    if (actionPath === "/gallery") {
      router.push(
        galleryListHref({
          ...(trimmed ? { q: trimmed } : {}),
          category_tag_id: preserveFilters?.category_tag_id,
          storage_location_id: preserveFilters?.storage_location_id,
        }),
      );
      return;
    }
    const url = trimmed
      ? `${actionPath}?q=${encodeURIComponent(trimmed)}`
      : actionPath;
    router.push(url);
  }

  return (
    <form
      onSubmit={onSubmit}
      className="flex w-full max-w-lg flex-col gap-2 sm:flex-row sm:items-end"
      role="search"
    >
      <div className="grid flex-1 gap-1">
        <Label htmlFor="product_search_q" className="sr-only">
          製品を検索
        </Label>
        <Input
          id="product_search_q"
          name="q"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="名前・カテゴリ・収納場所"
          autoComplete="off"
          className="min-h-11 rounded-full"
        />
      </div>
      <Button type="submit" className="min-h-11 shrink-0 rounded-full px-6">
        検索
      </Button>
    </form>
  );
}
