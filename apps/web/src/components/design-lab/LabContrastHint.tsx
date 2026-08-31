"use client";

import { checkOshiContrast, bestButtonForeground } from "@/components/design-lab/lab-contrast";
import type { LabOshiSwatch } from "@/components/design-lab/lab-meta";

type LabContrastHintProps = {
  swatch: LabOshiSwatch;
};

export default function LabContrastHint({ swatch }: LabContrastHintProps) {
  const checks = checkOshiContrast(swatch.hex);
  const bestFg = bestButtonForeground(swatch.hex);
  const anyFail = checks.some((c) => !c.ok_aa_normal);

  return (
    <section
      className="rounded-lg border border-zinc-200 bg-white p-3 text-sm"
      aria-label="コントラスト目安"
    >
      <p className="text-xs font-semibold text-zinc-800">
        コントラスト目安（{swatch.label} {swatch.hex}）
      </p>
      <p className="mt-0.5 text-[11px] text-zinc-500">
        WCAG AA 目安（通常文字 4.5:1）。厳密監査ではない。
      </p>
      <ul className="mt-2 space-y-1 text-[11px]">
        {checks.map((c) => (
          <li
            key={c.pair_label}
            className={
              c.ok_aa_normal ? "text-zinc-700" : "font-medium text-amber-800"
            }
          >
            {c.ok_aa_normal ? "OK" : "注意"} · {c.pair_label} · {c.ratio}:1
            {!c.ok_aa_normal && c.ok_aa_large
              ? "（大きい文字なら可）"
              : null}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] text-zinc-600">
        ボタン文字の推奨:{" "}
        <span
          className="inline-block rounded px-1.5 py-0.5 font-medium"
          style={{ background: swatch.hex, color: bestFg }}
        >
          {bestFg === "#ffffff" ? "白文字" : "濃い文字"}
        </span>
      </p>
      {anyFail ? (
        <p className="mt-1 text-[11px] text-amber-800" role="status">
          一部の組み合わせが弱いです。文字色か推し色の明度を調整してください。
        </p>
      ) : null}
    </section>
  );
}
