"use client";

import { useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import { API_PATHS, type ProductListItem, type ProductListResponse } from "@oshi/shared";
import {
  GalleryBulkBar,
  type BulkPickKind,
  type BulkTagOption,
} from "@/components/gallery/GalleryBulkBar";
import { ProductGalleryGrid } from "@/components/ProductGalleryGrid";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";
import {
  DEFAULT_GALLERY_CARD_FIELDS,
  type GalleryCardFields,
  type GalleryLayoutId,
} from "@/lib/displayPrefs";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import {
  hasActiveGalleryFilters,
  productsApiPath,
} from "@/lib/galleryListQuery";
import {
  GALLERY_BULK_MAX,
  exitSelectionViewState,
  filterItemsBySelection,
  isPageFullySelected,
  selectionFromIds,
  withPageSelected,
} from "@/lib/gallerySelection";

type Props = {
  initialItems: ProductListItem[];
  initialHasMore: boolean;
  limit: number;
  listQuery: GalleryListQuery;
  galleryLayout?: GalleryLayoutId;
  cardFields?: GalleryCardFields;
  storageOptions?: BulkTagOption[];
  categoryOptions?: BulkTagOption[];
};

export function GalleryBrowse({
  initialItems,
  initialHasMore,
  limit,
  listQuery,
  galleryLayout = "grid",
  cardFields = DEFAULT_GALLERY_CARD_FIELDS,
  storageOptions = [],
  categoryOptions = [],
}: Props) {
  const t = useTranslations("Gallery");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [offset, setOffset] = useState(listQuery.offset ?? 0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [selectionTruncated, setSelectionTruncated] = useState(false);
  const [selectingFiltered, setSelectingFiltered] = useState(false);
  const [picking, setPicking] = useState<BulkPickKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const pageIds = items.map((item) => item.registered_product_id);
  const pageFullySelected = isPageFullySelected(selectedIds, pageIds);
  const displayItems = filterItemsBySelection(
    items,
    selectedIds,
    showSelectedOnly,
  );
  const hasActiveFilters = hasActiveGalleryFilters(listQuery);

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setSelectionTruncated(false);
  }

  function exitSelectMode() {
    const cleared = exitSelectionViewState();
    setSelectionMode(cleared.selectionMode);
    setSelectedIds(new Set(cleared.selectedIds));
    setShowSelectedOnly(cleared.showSelectedOnly);
    setSelectionTruncated(false);
    setSelectingFiltered(false);
    setPicking(null);
    setBulkError(null);
  }

  function selectAllPage() {
    if (pageFullySelected) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of pageIds) next.delete(id);
        return next;
      });
      if (showSelectedOnly) setShowSelectedOnly(false);
    } else {
      setSelectedIds((prev) => withPageSelected(prev, pageIds));
    }
    setSelectionTruncated(false);
  }

  async function selectFilteredResults() {
    setSelectingFiltered(true);
    setBulkError(null);
    try {
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setBulkError(tCommon("loginRequired"));
        return;
      }
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        setBulkError(t("apiBaseMissing"));
        return;
      }
      const path = productsApiPath({
        ...listQuery,
        limit: GALLERY_BULK_MAX,
        offset: 0,
      });
      const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });
      if (!res.ok) {
        throw new Error(
          tCommon("fetchFailedStatus", { status: String(res.status) }),
        );
      }
      const body = (await res.json()) as ProductListResponse;
      const fetched = body.items ?? [];
      const ids = fetched.map((item) => item.registered_product_id);
      const { selectedIds: nextSelected, truncated } = selectionFromIds(ids);
      // has_more なら API 上限で打ち切った扱い
      const hitCap = Boolean(body.has_more) || truncated;
      setItems(fetched);
      setOffset(0);
      setHasMore(Boolean(body.has_more));
      setSelectedIds(nextSelected);
      setSelectionTruncated(hitCap);
      setShowSelectedOnly(false);
    } catch (e: unknown) {
      setBulkError(
        e instanceof Error ? e.message : tCommon("fetchFailed"),
      );
    } finally {
      setSelectingFiltered(false);
    }
  }

  async function applyBulkPatch(body: Record<string, unknown>) {
    if (selectedIds.size === 0) return;
    setSaving(true);
    setBulkError(null);
    try {
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setBulkError(tCommon("loginRequired"));
        return;
      }
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        setBulkError(t("apiBaseMissing"));
        return;
      }
      const res = await fetch(
        `${base.replace(/\/$/, "")}${API_PATHS.productsBulk}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            registered_product_ids: [...selectedIds].slice(0, GALLERY_BULK_MAX),
            ...body,
          }),
        },
      );
      if (!res.ok) {
        throw new Error(
          tCommon("fetchFailedStatus", { status: String(res.status) }),
        );
      }
      exitSelectMode();
      router.refresh();
    } catch (e: unknown) {
      setBulkError(
        e instanceof Error ? e.message : tCommon("fetchFailed"),
      );
    } finally {
      setSaving(false);
      setPicking(null);
    }
  }

  async function loadMore() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        setError(tCommon("loginRequired"));
        return;
      }
      const base = process.env.NEXT_PUBLIC_API_BASE_URL;
      if (!base) {
        setError(t("apiBaseMissing"));
        return;
      }
      const nextOffset = offset + limit;
      const path = productsApiPath({
        ...listQuery,
        limit,
        offset: nextOffset,
      });
      const res = await fetch(`${base.replace(/\/$/, "")}${path}`, {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      });
      if (!res.ok) {
        throw new Error(
          tCommon("fetchFailedStatus", { status: String(res.status) }),
        );
      }
      const body = (await res.json()) as ProductListResponse;
      setItems((prev) => [...prev, ...(body.items ?? [])]);
      setOffset(nextOffset);
      setHasMore(Boolean(body.has_more));
    } catch (e: unknown) {
      setError(
        e instanceof Error ? e.message : tCommon("fetchFailed"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="stack-density">
      {selectionMode ? (
        <GalleryBulkBar
          selectedCount={selectedIds.size}
          pageItemCount={items.length}
          pageFullySelected={pageFullySelected}
          showSelectedOnly={showSelectedOnly}
          hasActiveFilters={hasActiveFilters}
          selectingFiltered={selectingFiltered}
          selectionTruncated={selectionTruncated}
          storageOptions={storageOptions}
          categoryOptions={categoryOptions}
          picking={picking}
          saving={saving}
          error={bulkError}
          onSelectAllPage={selectAllPage}
          onSelectFiltered={() => void selectFilteredResults()}
          onToggleShowSelectedOnly={() =>
            setShowSelectedOnly((prev) => !prev)
          }
          onStartPick={(kind) => setPicking(kind)}
          onCancelPick={() => setPicking(null)}
          onPickStorage={(id) =>
            void applyBulkPatch(
              id == null
                ? { clear_storage_location: true }
                : { storage_location_id: id },
            )
          }
          onPickCategory={(id) =>
            void applyBulkPatch(
              id == null
                ? { clear_category_tag: true }
                : { category_tag_id: id },
            )
          }
          onClearSelection={() => {
            setSelectedIds(new Set());
            setShowSelectedOnly(false);
            setSelectionTruncated(false);
          }}
          onExitSelectMode={exitSelectMode}
        />
      ) : (
        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-9"
            onClick={() => setSelectionMode(true)}
          >
            {t("selectMode")}
          </Button>
        </div>
      )}
      <ProductGalleryGrid
        items={displayItems}
        listQuery={listQuery}
        layout={galleryLayout}
        cardFields={cardFields}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />
      {showSelectedOnly && displayItems.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("bulkShowSelectedEmpty")}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      {hasMore && !showSelectedOnly ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="secondary"
            className="min-h-11 w-full max-w-xs rounded-full"
            disabled={loading || selectingFiltered}
            onClick={() => void loadMore()}
          >
            {loading ? tCommon("loading") : t("loadMore")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
