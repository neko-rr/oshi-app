/**
 * ダッシュボードのカラータグ割合。色は API の製品ラベル（テーマ色ではない）。
 */

export type ColorTagShareItem = {
  slot: number;
  color_tag_name: string;
  color_tag_color: string;
  count: number;
  share: number;
};

const HEX = /^#[0-9A-Fa-f]{6}$/;

export function isColorTagShareItem(raw: unknown): raw is ColorTagShareItem {
  if (!raw || typeof raw !== "object") return false;
  const o = raw as Record<string, unknown>;
  return (
    typeof o.slot === "number" &&
    typeof o.color_tag_name === "string" &&
    typeof o.color_tag_color === "string" &&
    typeof o.count === "number" &&
    typeof o.share === "number"
  );
}

export function formatSharePercent(share: number): string {
  if (!Number.isFinite(share) || share <= 0) return "0%";
  const pct = Math.round(share * 1000) / 10;
  return `${pct}%`;
}

export function pieConicGradient(items: ColorTagShareItem[]): string | null {
  const parts = items.filter(
    (row) => row.count > 0 && HEX.test(row.color_tag_color),
  );
  if (parts.length === 0) return null;
  let cursor = 0;
  const stops: string[] = [];
  for (const row of parts) {
    const start = cursor;
    cursor += Math.max(0, Math.min(1, row.share)) * 100;
    stops.push(`${row.color_tag_color} ${start}% ${cursor}%`);
  }
  if (cursor < 100) {
    stops.push(`var(--muted) ${cursor}% 100%`);
  }
  return `conic-gradient(${stops.join(", ")})`;
}
