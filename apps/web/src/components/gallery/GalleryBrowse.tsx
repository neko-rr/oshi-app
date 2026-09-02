"use client";

import { useState } from "react";
import type { ProductListItem, ProductListResponse } from "@oshi/shared";
import { ProductGalleryGrid } from "@/components/ProductGalleryGrid";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import { productsApiPath } from "@/lib/galleryListQuery";

type Props = {
  initialItems: ProductListItem[];
  initialHasMore: boolean;
  limit: number;
  listQuery: GalleryListQuery;
};

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

export function GalleryBrowse({
  initialItems,
  initialHasMore,
  limit,
  listQuery,
}: Props) {
  const [items, setItems] = useState(initialItems);
  const [offset, setOffset] = useState(listQuery.offset ?? 0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setError("ログインが必要です");
        return;
      }
      const nextOffset = offset + limit;
      const path = productsApiPath({
        ...listQuery,
        limit,
        offset: nextOffset,
      });
      const res = await fetch(`${apiBase()}${path}`, {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });
      if (!res.ok) {
        throw new Error(`取得に失敗しました（${res.status}）`);
      }
      const body = (await res.json()) as ProductListResponse;
      setItems((prev) => [...prev, ...(body.items ?? [])]);
      setOffset(nextOffset);
      setHasMore(Boolean(body.has_more));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ProductGalleryGrid items={items} listQuery={listQuery} />
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {hasMore ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full max-w-xs rounded-full"
            disabled={loading}
            onClick={() => void loadMore()}
          >
            {loading ? "読み込み中…" : "もっと見る"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
