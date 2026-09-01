import Link from "next/link";
import type { ProductListItem } from "@oshi/shared";

type Props = {
  items: ProductListItem[];
};

export function ProductGalleryGrid({ items }: Props) {
  if (items.length === 0) {
    return null;
  }

  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {items.map((item) => (
        <li key={item.registered_product_id}>
          <Link
            href={`/gallery/${item.registered_product_id}`}
            className="block overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition hover:opacity-95"
          >
            <div className="aspect-square bg-muted">
              {item.photo_thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element -- signed URL はホストが可変
                <img
                  src={item.photo_thumbnail_url}
                  alt={item.product_name?.trim() || "製品写真"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                  画像なし
                </div>
              )}
            </div>
            <div className="p-3 sm:p-4">
              <p className="font-medium leading-snug">
                {item.product_name?.trim() ||
                  `製品 #${item.registered_product_id}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {item.creation_date ? item.creation_date : "日付なし"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
