"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { ProductListItem } from "@oshi/shared";
import { FormattedAppMoney } from "@/components/format/FormattedAppMoney";
import { ProductTagChip } from "@/components/tags/ProductTagChip";
import { Button } from "@/components/ui/button";
import {
  DEFAULT_GALLERY_CARD_FIELDS,
  type GalleryCardFields,
  type GalleryLayoutId,
} from "@/lib/displayPrefs";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import { galleryDetailHref } from "@/lib/galleryListQuery";
import { cn } from "@/lib/utils";

type Props = {
  items: ProductListItem[];
  listQuery?: GalleryListQuery;
  layout?: GalleryLayoutId;
  cardFields?: GalleryCardFields;
  selectionMode?: boolean;
  selectedIds?: ReadonlySet<number>;
  onToggleSelect?: (registeredProductId: number) => void;
};

function TagRow({ item }: { item: ProductListItem }) {
  if (!item.category_tag && !item.storage_location) return null;
  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {item.category_tag ? (
        <ProductTagChip
          name={item.category_tag.name}
          icon={item.category_tag.icon}
          color={item.category_tag.color}
          variant="category"
          compact
        />
      ) : null}
      {item.storage_location ? (
        <ProductTagChip
          name={item.storage_location.name}
          icon={item.storage_location.icon}
          variant="storage"
          compact
        />
      ) : null}
    </div>
  );
}

function PriceLine({ item }: { item: ProductListItem }) {
  if (item.purchase_price == null) return null;
  return (
    <p className="mt-1 truncate text-xs text-muted-foreground">
      <FormattedAppMoney
        value={item.purchase_price}
        currencyCode={item.currency_code}
      />
    </p>
  );
}

function CardTextBlock({
  item,
  title,
  showName,
  showPrice,
  showTags,
}: {
  item: ProductListItem;
  title: string;
  showName: boolean;
  showPrice: boolean;
  showTags: boolean;
}) {
  if (!showName && !showPrice && !showTags) return null;
  return (
    <>
      {showName ? (
        <p className="truncate text-sm font-medium leading-snug">{title}</p>
      ) : null}
      {showPrice ? <PriceLine item={item} /> : null}
      {showTags ? <TagRow item={item} /> : null}
    </>
  );
}

function SelectionBadge({ selected }: { selected: boolean }) {
  return (
    <span
      className={cn(
        "pointer-events-none absolute top-2 left-2 z-10 flex size-6 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm",
        selected
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card/90 text-muted-foreground",
      )}
      aria-hidden
    >
      {selected ? "✓" : ""}
    </span>
  );
}

export function ProductGalleryGrid({
  items,
  listQuery = {},
  layout = "grid",
  cardFields = DEFAULT_GALLERY_CARD_FIELDS,
  selectionMode = false,
  selectedIds,
  onToggleSelect,
}: Props) {
  const t = useTranslations("Gallery");
  const tCommon = useTranslations("Common");
  const showName = cardFields.gallery_show_name;
  const showTags = cardFields.gallery_show_tags;
  const showPrice = cardFields.gallery_show_price;
  const hasText = showName || showTags || showPrice;

  function itemTitle(item: ProductListItem): string {
    return (
      item.product_name?.trim() ||
      t("productFallback", { id: item.registered_product_id })
    );
  }

  if (items.length === 0) {
    return null;
  }

  if (layout === "list") {
    return (
      <ul className="flex flex-col gap-y-density">
        {items.map((item) => {
          const title = itemTitle(item);
          const selected = selectedIds?.has(item.registered_product_id) ?? false;
          const shellClass =
            "relative flex gap-3 overflow-hidden rounded-xl bg-card p-2 text-card-foreground shadow-sm ring-1 ring-border transition hover:opacity-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";
          const body = (
            <>
              {selectionMode ? <SelectionBadge selected={selected} /> : null}
              <div className="size-20 shrink-0 overflow-hidden rounded-lg bg-muted sm:size-24">
                {item.photo_thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.photo_thumbnail_url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[10px] text-muted-foreground">
                    {tCommon("none")}
                  </div>
                )}
              </div>
              {hasText ? (
                <div className="min-w-0 flex-1 py-1">
                  <CardTextBlock
                    item={item}
                    title={title}
                    showName={showName}
                    showPrice={showPrice}
                    showTags={showTags}
                  />
                </div>
              ) : null}
            </>
          );
          return (
            <li key={item.registered_product_id}>
              {selectionMode ? (
                <Button
                  type="button"
                  variant="ghost"
                  aria-label={title}
                  aria-pressed={selected}
                  onClick={() => onToggleSelect?.(item.registered_product_id)}
                  className={cn(
                    shellClass,
                    "h-auto w-full justify-start p-0 text-left hover:bg-transparent",
                    selected && "ring-2 ring-primary",
                  )}
                >
                  {body}
                </Button>
              ) : (
                <Link
                  href={galleryDetailHref(item.registered_product_id, listQuery)}
                  aria-label={title}
                  className={shellClass}
                >
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  const gridClass =
    layout === "large"
      ? "gallery-density-grid grid grid-cols-1 sm:grid-cols-2"
      : "gallery-density-grid grid grid-cols-2 sm:grid-cols-3";

  return (
    <ul className={gridClass}>
      {items.map((item, index) => {
        const title = itemTitle(item);
        const selected = selectedIds?.has(item.registered_product_id) ?? false;
        const shellClass = cn(
          "group relative block overflow-hidden rounded-xl bg-card text-card-foreground shadow-sm ring-1 ring-border transition duration-200 hover:opacity-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          selectionMode && selected && "ring-2 ring-primary",
        );
        const body = (
          <>
            {selectionMode ? <SelectionBadge selected={selected} /> : null}
            <div
              className={
                layout === "large"
                  ? "aspect-[4/5] bg-muted sm:aspect-[3/4]"
                  : "aspect-[4/5] bg-muted"
              }
            >
              {item.photo_thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed URL はホストが可変
                <img
                  src={item.photo_thumbnail_url}
                  alt=""
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  {t("noImage")}
                </div>
              )}
            </div>
            {hasText ? (
              <div className="gallery-density-card-pad">
                <CardTextBlock
                  item={item}
                  title={title}
                  showName={showName}
                  showPrice={showPrice}
                  showTags={showTags}
                />
              </div>
            ) : null}
          </>
        );
        return (
          <li key={item.registered_product_id}>
            {selectionMode ? (
              <Button
                type="button"
                variant="ghost"
                aria-label={title}
                aria-pressed={selected}
                onClick={() => onToggleSelect?.(item.registered_product_id)}
                className={cn(
                  shellClass,
                  "h-auto w-full justify-start p-0 text-left hover:bg-transparent",
                )}
                style={{
                  animationDelay: `${Math.min(index, 8) * 40}ms`,
                }}
              >
                {body}
              </Button>
            ) : (
              <Link
                href={galleryDetailHref(item.registered_product_id, listQuery)}
                aria-label={title}
                className={shellClass}
                style={{
                  animationDelay: `${Math.min(index, 8) * 40}ms`,
                }}
              >
                {body}
              </Link>
            )}
          </li>
        );
      })}
    </ul>
  );
}
