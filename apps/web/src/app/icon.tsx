import { BrandPlaceholderIcon } from "@/components/brand/BrandPlaceholderIcon";

export const size = { width: 512, height: 512 };
export const contentType = "image/png";

/** 仮アイコン。差し替え手順は BrandPlaceholderIcon.tsx */
export default function Icon() {
  return BrandPlaceholderIcon(size.width);
}
