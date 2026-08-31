/**
 * 色覚シミュレーション用 SVG フィルタ定義（非表示）。
 * Design Lab のプレビュー枠に CSS filter: url(#…) で参照する。
 */
import {
  LAB_CVD_FILTER_IDS,
  LAB_CVD_MATRICES,
} from "@/components/design-lab/lab-cvd";

export default function LabCvdFilters() {
  return (
    <svg
      aria-hidden
      focusable="false"
      className="pointer-events-none absolute h-0 w-0 overflow-hidden"
    >
      <defs>
        {(
          Object.keys(LAB_CVD_FILTER_IDS) as Array<
            keyof typeof LAB_CVD_FILTER_IDS
          >
        ).map((key) => (
          <filter
            key={key}
            id={LAB_CVD_FILTER_IDS[key]}
            colorInterpolationFilters="linearRGB"
          >
            <feColorMatrix type="matrix" values={LAB_CVD_MATRICES[key]} />
          </filter>
        ))}
      </defs>
    </svg>
  );
}
