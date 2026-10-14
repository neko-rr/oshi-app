import { Link } from "@/i18n/navigation";
import { formatSharePercent } from "@/lib/colorTagShare";
import { galleryListHref } from "@/lib/galleryListQuery";
import { isProductColorCode } from "@/lib/productColor";

type Row = {
  product_color_code: string;
  product_color_hex: string;
  count: number;
  share: number;
};

function isRow(value: unknown): value is Row {
  if (!value || typeof value !== "object") return false;
  const row = value as Row;
  return (
    typeof row.product_color_code === "string" &&
    typeof row.product_color_hex === "string" &&
    typeof row.count === "number" &&
    typeof row.share === "number"
  );
}

type Props = {
  title: string;
  hint: string;
  items: unknown[];
  noDataLabel: string;
  uncoloredLabel: string;
  uncoloredCount: number;
  names: Record<string, string>;
};

/**
 * グッズの色の件数。件数がある色だけ、色の丸つきで出す。
 */
export function ProductColorSharePanel({
  title,
  hint,
  items,
  noDataLabel,
  uncoloredLabel,
  uncoloredCount,
  names,
}: Props) {
  const rows = items.filter(isRow);
  return (
    <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{noDataLabel}</p>
      ) : (
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((row) => {
            const code = row.product_color_code;
            const href = isProductColorCode(code)
              ? galleryListHref({ product_color_codes: [code] })
              : "/gallery";
            return (
              <li key={code}>
                <Link href={href} className="flex flex-col gap-1 rounded-md px-1 py-1 hover:bg-muted/60">
                  <span className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="flex min-w-0 items-center gap-2">
                      <span
                        className="size-3 shrink-0 rounded-full border border-border"
                        style={{ backgroundColor: row.product_color_hex }}
                        aria-hidden
                      />
                      <span className="truncate">{names[code] ?? code}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {row.count} · {formatSharePercent(row.share)}
                    </span>
                  </span>
                  <span className="h-2 overflow-hidden rounded-full bg-muted">
                    <span
                      className="block h-full rounded-full"
                      style={{
                        width: `${Math.round(row.share * 1000) / 10}%`,
                        backgroundColor: row.product_color_hex,
                      }}
                    />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      {uncoloredCount > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">{uncoloredLabel}</p>
      ) : null}
    </section>
  );
}
