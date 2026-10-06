import {
  formatSharePercent,
  isColorTagShareItem,
  pieConicGradient,
  type ColorTagShareItem,
} from "@/lib/colorTagShare";

type Props = {
  title: string;
  hint: string;
  items: unknown[];
  noDataLabel: string;
  assignmentLabel: string;
  untaggedLabel: string;
  assignmentTotal: number;
  untaggedCount: number;
  pieLabel: string;
};

/**
 * 推し色（カラータグ）の割合。円は付与ありのみ、バーは枠すべて。
 */
export function ColorTagSharePanel({
  title,
  hint,
  items,
  noDataLabel,
  assignmentLabel,
  untaggedLabel,
  assignmentTotal,
  untaggedCount,
  pieLabel,
}: Props) {
  const rows: ColorTagShareItem[] = items.filter(isColorTagShareItem);
  const pie = pieConicGradient(rows);
  const applied =
    assignmentTotal > 0
      ? assignmentTotal
      : rows.reduce((sum, row) => sum + row.count, 0);
  const hasCounts = applied > 0;

  return (
    <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
      <h2 className="text-lg font-medium tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{hint}</p>
      {!hasCounts ? (
        <p className="mt-3 text-sm text-muted-foreground">{noDataLabel}</p>
      ) : null}
      {hasCounts && pie ? (
        <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:items-center">
          <div
            className="size-36 shrink-0 rounded-full border border-border"
            style={{ background: pie }}
            role="img"
            aria-label={pieLabel}
          />
          <p className="text-sm text-muted-foreground">{assignmentLabel}</p>
        </div>
      ) : null}
      {rows.length > 0 ? (
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.slot} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span
                    className="size-3 shrink-0 rounded-full border border-border"
                    style={
                      row.color_tag_color
                        ? { backgroundColor: row.color_tag_color }
                        : undefined
                    }
                    aria-hidden
                  />
                  <span className="truncate">{row.color_tag_name}</span>
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {row.count} · {formatSharePercent(row.share)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.round(row.share * 1000) / 10}%`,
                    ...(row.color_tag_color
                      ? { backgroundColor: row.color_tag_color }
                      : {}),
                  }}
                />
              </div>
            </li>
          ))}
        </ul>
      ) : null}
      {untaggedCount > 0 ? (
        <p className="mt-3 text-xs text-muted-foreground">{untaggedLabel}</p>
      ) : null}
    </section>
  );
}
