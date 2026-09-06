"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { TagChipPicker } from "@/components/tags/TagChipPicker";
import { NetworkRetryNotice } from "@/components/feedback/NetworkRetryNotice";

export type BulkTagOption = {
  id: number;
  name: string;
  icon?: string | null;
  color?: string | null;
};

export type BulkPickKind = "storage" | "category";

type Props = {
  selectedCount: number;
  pageItemCount: number;
  pageFullySelected: boolean;
  showSelectedOnly: boolean;
  hasActiveFilters: boolean;
  selectingFiltered: boolean;
  selectionTruncated: boolean;
  storageOptions: BulkTagOption[];
  categoryOptions: BulkTagOption[];
  picking: BulkPickKind | null;
  saving: boolean;
  error: string | null;
  errorOffline?: boolean;
  onSelectAllPage: () => void;
  onSelectFiltered: () => void;
  onToggleShowSelectedOnly: () => void;
  onStartPick: (kind: BulkPickKind) => void;
  onCancelPick: () => void;
  onPickStorage: (id: number | null) => void;
  onPickCategory: (id: number | null) => void;
  onClearSelection: () => void;
  onExitSelectMode: () => void;
  onRetryError?: () => void;
};

/**
 * ギャラリー一括バー（範囲操作・収納・カテゴリ）。
 */
export function GalleryBulkBar({
  selectedCount,
  pageItemCount,
  pageFullySelected,
  showSelectedOnly,
  hasActiveFilters,
  selectingFiltered,
  selectionTruncated,
  storageOptions,
  categoryOptions,
  picking,
  saving,
  error,
  errorOffline = false,
  onSelectAllPage,
  onSelectFiltered,
  onToggleShowSelectedOnly,
  onStartPick,
  onCancelPick,
  onPickStorage,
  onPickCategory,
  onClearSelection,
  onExitSelectMode,
  onRetryError,
}: Props) {
  const t = useTranslations("Gallery");
  const busy = saving || selectingFiltered;

  return (
    <div
      className="fixed inset-x-0 bottom-[calc(3.25rem+env(safe-area-inset-bottom,0px))] z-30 mx-auto flex max-w-3xl flex-col gap-2 border-t border-border bg-card/95 px-3 py-3 shadow-sm backdrop-blur lg:sticky lg:top-14 lg:bottom-auto lg:z-10 lg:rounded-xl lg:border"
      role="region"
      aria-label={t("bulkSelected", { count: selectedCount })}
    >
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-foreground">
          {t("bulkSelected", { count: selectedCount })}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-9"
          disabled={pageItemCount === 0 || busy}
          onClick={onSelectAllPage}
        >
          {pageFullySelected ? t("bulkDeselectPage") : t("bulkSelectPage")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-9"
          disabled={busy}
          onClick={onSelectFiltered}
        >
          {selectingFiltered
            ? t("bulkSelectingFiltered")
            : hasActiveFilters
              ? t("bulkSelectFiltered")
              : t("bulkSelectLoadedMax")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={showSelectedOnly ? "default" : "outline"}
          className="min-h-9"
          disabled={selectedCount === 0 || busy}
          onClick={onToggleShowSelectedOnly}
          aria-pressed={showSelectedOnly}
        >
          {t("bulkShowSelectedOnly", { count: selectedCount })}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="default"
          className="min-h-9"
          disabled={selectedCount === 0 || busy}
          onClick={() => onStartPick("storage")}
        >
          {t("bulkChangeStorage")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="min-h-9"
          disabled={selectedCount === 0 || busy}
          onClick={() => onStartPick("category")}
        >
          {t("bulkChangeCategory")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-9"
          disabled={selectedCount === 0 || busy}
          onClick={onClearSelection}
        >
          {t("bulkClearSelection")}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="min-h-9"
          disabled={busy}
          onClick={onExitSelectMode}
        >
          {t("bulkCancel")}
        </Button>
      </div>
      {selectionTruncated ? (
        <p className="text-xs text-muted-foreground" role="status">
          {t("bulkSelectionTruncated")}
        </p>
      ) : null}
      {error ? (
        <NetworkRetryNotice
          message={error}
          offline={errorOffline}
          onRetry={onRetryError}
        />
      ) : null}
      {picking === "storage" ? (
        <div className="rounded-md border border-border px-2 py-2">
          <TagChipPicker
            label={t("bulkPickStorageHint")}
            options={storageOptions.map((s) => ({
              id: s.id,
              name: s.name,
              icon: s.icon,
            }))}
            value={null}
            onChange={(id) => onPickStorage(id)}
            noneLabel={t("bulkNoStorage")}
            variant="storage"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="mt-2 min-h-9"
            onClick={onCancelPick}
          >
            {t("bulkCancel")}
          </Button>
        </div>
      ) : null}
      {picking === "category" ? (
        <div className="rounded-md border border-border px-2 py-2">
          <TagChipPicker
            label={t("bulkPickCategoryHint")}
            options={categoryOptions.map((c) => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
              color: c.color,
            }))}
            value={null}
            onChange={(id) => onPickCategory(id)}
            noneLabel={t("bulkNoCategory")}
            variant="category"
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="mt-2 min-h-9"
            onClick={onCancelPick}
          >
            {t("bulkCancel")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
