/**
 * 簡易コントラスト比（相対輝度）。Lab の推し色×文字の警告用。
 * WCAG の厳密実装ではなく、開発時の目安。
 */

function parseHex(hex: string): { r: number; g: number; b: number } | null {
  const h = hex.replace("#", "").trim();
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return {
    r: Number.parseInt(h.slice(0, 2), 16),
    g: Number.parseInt(h.slice(2, 4), 16),
    b: Number.parseInt(h.slice(4, 6), 16),
  };
}

function channelToLinear(c: number): number {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number | null {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const r = channelToLinear(rgb.r);
  const g = channelToLinear(rgb.g);
  const b = channelToLinear(rgb.b);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(hexA: string, hexB: string): number | null {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  if (l1 == null || l2 == null) return null;
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

export type ContrastCheck = {
  pair_label: string;
  ratio: number;
  ok_aa_normal: boolean;
  ok_aa_large: boolean;
};

/** 推し色を primary にしたときの代表的な組み合わせ */
export function checkOshiContrast(oshiHex: string): ContrastCheck[] {
  const pairs: { label: string; fg: string; bg: string }[] = [
    { label: "ボタン文字（白）", fg: "#ffffff", bg: oshiHex },
    { label: "ボタン文字（ほぼ黒）", fg: "#1a1614", bg: oshiHex },
    { label: "本文上のリンク色", fg: oshiHex, bg: "#faf8f6" },
  ];

  const out: ContrastCheck[] = [];
  for (const p of pairs) {
    const ratio = contrastRatio(p.fg, p.bg);
    if (ratio == null) continue;
    out.push({
      pair_label: p.label,
      ratio: Math.round(ratio * 10) / 10,
      ok_aa_normal: ratio >= 4.5,
      ok_aa_large: ratio >= 3,
    });
  }
  return out;
}

export function bestButtonForeground(oshiHex: string): "#ffffff" | "#1a1614" {
  const white = contrastRatio("#ffffff", oshiHex) ?? 0;
  const dark = contrastRatio("#1a1614", oshiHex) ?? 0;
  return white >= dark ? "#ffffff" : "#1a1614";
}
