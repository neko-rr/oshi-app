import Link from "next/link";
import type { ProductListItem } from "@oshi/shared";
import { ProductTagChip } from "@/components/tags/ProductTagChip";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import { galleryDetailHref } from "@/lib/galleryListQuery";

type Props = {
  items: ProductListItem[];
  listQuery?: GalleryListQuery;
};

export function ProductGalleryGrid({ items, listQuery = {} }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3">
      {items.map((item, index) => (
        <li key={item.registered_product_id}>
          <Link
            href={galleryDetailHref(item.registered_product_id, listQuery)}
            className="group block overflow-hidden rounded-xl bg-card text-card-foreground shadow-sm ring-1 ring-border transition duration-200 hover:opacity-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{
              animationDelay: `${Math.min(index, 8) * 40}ms`,
            }}
          >
            <div className="aspect-[4/5] bg-muted">
              {item.photo_thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed URL はホストが可変
                <img
                  src={item.photo_thumbnail_url}
                  alt={item.product_name?.trim() || "製品写真"}
                  className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  画像なし
                </div>
              )}
            </div>
            <div className="p-2.5 sm:p-3">
              <p className="truncate text-sm font-medium leading-snug">
                {item.product_name?.trim() ||
                  `製品 #${item.registered_product_id}`}
              </p>
              {item.category_tag || item.storage_location ? (
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
              ) : null}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
