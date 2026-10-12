"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import {
  API_PATHS,
  type ProductEditListItem,
  type ProductListItem,
  type ProductListResponse,
} from "@oshi/shared";
import {
  GalleryBulkBar,
  type BulkPickKind,
  type BulkTagOption,
} from "@/components/gallery/GalleryBulkBar";
import { GalleryEditList } from "@/components/gallery/GalleryEditList";
import { ProductGalleryGrid } from "@/components/ProductGalleryGrid";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { NetworkRetryNotice } from "@/components/feedback/NetworkRetryNotice";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/client";
import {
  DEFAULT_GALLERY_CARD_FIELDS,
  DEFAULT_GALLERY_IMAGE_FIT,
  type GalleryCardFields,
  type GalleryImageFitId,
  type GalleryLayoutId,
} from "@/lib/displayPrefs";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import {
  hasActiveGalleryFilters,
  productsApiPath,
} from "@/lib/galleryListQuery";
import {
  writeGalleryBrowseOrder,
} from "@/lib/galleryBrowseOrder";
import {
  GALLERY_BULK_MAX,
  exitSelectionViewState,
  filterItemsBySelection,
  isPageFullySelected,
  selectionFromIds,
  withPageSelected,
} from "@/lib/gallerySelection";
import { isLikelyOfflineError, networkUserMessage } from "@/lib/networkError";

type ColorEditOption = {
  slot: number;
  name: string;
  color: string;
};

type Props = {
  initialItems: ProductListItem[];
  initialHasMore: boolean;
  limit: number;
  listQuery: GalleryListQuery;
  galleryLayout?: GalleryLayoutId;
  galleryImageFit?: GalleryImageFitId;
  cardFields?: GalleryCardFields;
  storageOptions?: BulkTagOption[];
  categoryOptions?: BulkTagOption[];
  colorOptions?: ColorEditOption[];
};

export function GalleryBrowse({
  initialItems,
  initialHasMore,
  limit,
  listQuery,
  galleryLayout = "grid",
  galleryImageFit = DEFAULT_GALLERY_IMAGE_FIT,
  cardFields = DEFAULT_GALLERY_CARD_FIELDS,
  storageOptions = [],
  categoryOptions = [],
  colorOptions = [],
}: Props) {
  const t = useTranslations("Gallery");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { flashSuccess } = useFeedback();
  const [items, setItems] = useState<ProductEditListItem[]>(initialItems);
  const [editMode, setEditMode] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [offset, setOffset] = useState(listQuery.offset ?? 0);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorOffline, setErrorOffline] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
  const [showSelectedOnly, setShowSelectedOnly] = useState(false);
  const [selectionTruncated, setSelectionTruncated] = useState(false);
  const [selectingFiltered, setSelectingFiltered] = useState(false);
  const [picking, setPicking] = useState<BulkPickKind | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [bulkErrorOffline, setBulkErrorOffline] = useState(false);
  const lastBulkBodyRef = useRef<Record<string, unknown> | null>(null);
  const listRetryRef = useRef<"more" | "edit">("more");

  useEffect(() => {
    writeGalleryBrowseOrder(items.map((item) => item.registered_product_id));
  }, [items]);

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
    lastBulkBodyRef.current = body;
    setSaving(true);
    setBulkError(null);
    setBulkErrorOffline(false);
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
      flashSuccess(tCommon("bulkUpdatedFlash"));
      exitSelectMode();
      router.refresh();
    } catch (e: unknown) {
      const offline = isLikelyOfflineError(e);
      setBulkErrorOffline(offline);
      setBulkError(
        networkUserMessage(e, {
          offline: tCommon("offlineHint"),
          fallback: tCommon("fetchFailed"),
        }),
      );
    } finally {
      setSaving(false);
      setPicking(null);
    }
  }

  async function loadMore() {
    setLoading(true);
    setError(null);
    setErrorOffline(false);
    listRetryRef.current = "more";
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
        ...(editMode ? { view: "edit" as const } : {}),
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
      const offline = isLikelyOfflineError(e);
      setErrorOffline(offline);
      setError(
        networkUserMessage(e, {
          offline: tCommon("offlineHint"),
          fallback: tCommon("fetchFailed"),
        }),
      );
    } finally {
      setLoading(false);
    }
  }

  async function enterEditMode() {
    if (selectionMode || editLoading) return;
    setEditLoading(true);
    setError(null);
    setErrorOffline(false);
    listRetryRef.current = "edit";
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
      const collected: ProductEditListItem[] = [];
      let cursor = listQuery.offset ?? 0;
      let nextHasMore = hasMore;
      const targetCount = Math.max(items.length, 1);
      while (collected.length < targetCount) {
        const pageLimit = Math.min(100, targetCount - collected.length);
        const path = productsApiPath({
          ...listQuery,
          limit: pageLimit,
          offset: cursor,
          view: "edit",
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
        const batch = (body.items ?? []) as ProductEditListItem[];
        collected.push(...batch);
        nextHasMore = Boolean(body.has_more);
        if (batch.length === 0) break;
        cursor += batch.length;
        if (batch.length < pageLimit) break;
      }
      if (collected.length === 0) {
        throw new Error(tCommon("fetchFailed"));
      }
      setItems(collected);
      setHasMore(nextHasMore);
      setEditMode(true);
    } catch (e: unknown) {
      const offline = isLikelyOfflineError(e);
      setErrorOffline(offline);
      setError(
        networkUserMessage(e, {
          offline: tCommon("offlineHint"),
          fallback: tCommon("fetchFailed"),
        }),
      );
    } finally {
      setEditLoading(false);
    }
  }

  return (
    <div
      className={[
        "stack-density",
        selectionMode || editMode
          ? "pb-[calc(8rem+env(safe-area-inset-bottom,0px))] lg:pb-0"
          : "",
      ].join(" ")}
    >
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
          errorOffline={bulkErrorOffline}
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
          onRetryError={() => {
            const body = lastBulkBodyRef.current;
            if (body) void applyBulkPatch(body);
          }}
        />
      ) : editMode ? null : (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            onClick={() => setSelectionMode(true)}
          >
            {t("selectMode")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="min-h-11"
            disabled={editLoading}
            onClick={() => void enterEditMode()}
          >
            {editLoading ? tCommon("loading") : t("editMode")}
          </Button>
        </div>
      )}
      {editMode ? (
        <GalleryEditList
          items={items}
          categoryOptions={categoryOptions}
          storageOptions={storageOptions}
          colorOptions={colorOptions}
          hasMore={hasMore}
          loadingMore={loading}
          onLoadMore={() => void loadMore()}
          onExit={() => setEditMode(false)}
          onItemsChange={setItems}
        />
      ) : (
      <ProductGalleryGrid
        items={displayItems}
        listQuery={listQuery}
        layout={galleryLayout}
        imageFit={galleryImageFit}
        cardFields={cardFields}
        selectionMode={selectionMode}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />
      )}
      {showSelectedOnly && displayItems.length === 0 ? (
        <p className="text-sm text-muted-foreground" role="status">
          {t("bulkShowSelectedEmpty")}
        </p>
      ) : null}
      {error ? (
        <NetworkRetryNotice
          message={error}
          offline={errorOffline}
          onRetry={() =>
            void (listRetryRef.current === "edit" ? enterEditMode() : loadMore())
          }
        />
      ) : null}
      {hasMore && !showSelectedOnly && !editMode ? (
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
