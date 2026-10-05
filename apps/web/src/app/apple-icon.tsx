import { BrandPlaceholderIcon } from "@/components/brand/BrandPlaceholderIcon";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

/** 仮の apple-touch-icon。差し替え手順は BrandPlaceholderIcon.tsx */
export default function AppleIcon() {
  return BrandPlaceholderIcon(size.width);
}
