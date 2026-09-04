/** 表示設定の離散プリセット（API / DB と一致）。ラベルは messages の DisplaySettings。 */

export type ListSortId = "newest" | "name" | "created_at";
export type GalleryLayoutId = "grid" | "large" | "list";
export type LandingPageId = "home" | "gallery" | "register";
export type RegisterStartStepId = "barcode" | "photo" | "confirm";
/** カードに載せる項目。将来はここへ id を足す */
export type GalleryCardFieldId = "name" | "tags" | "price";

export const DEFAULT_LIST_SORT: ListSortId = "newest";
export const DEFAULT_GALLERY_LAYOUT: GalleryLayoutId = "grid";
export const DEFAULT_LANDING_PAGE: LandingPageId = "home";
export const DEFAULT_REGISTER_START_STEP: RegisterStartStepId = "barcode";
export const DEFAULT_GALLERY_SHOW = true;

export const LIST_SORT_IDS: readonly ListSortId[] = [
  "newest",
  "name",
  "created_at",
] as const;

export const GALLERY_LAYOUT_IDS: readonly GalleryLayoutId[] = [
  "grid",
  "large",
  "list",
] as const;

export const GALLERY_CARD_FIELD_IDS: readonly GalleryCardFieldId[] = [
  "name",
  "tags",
  "price",
] as const;

export const REGISTER_START_STEP_IDS: readonly RegisterStartStepId[] = [
  "barcode",
  "photo",
  "confirm",
] as const;

export const LANDING_PAGE_OPTIONS: readonly {
  id: LandingPageId;
  path: string;
}[] = [
  { id: "home", path: "/" },
  { id: "gallery", path: "/gallery" },
  { id: "register", path: "/register" },
] as const;

export const LANDING_PAGE_IDS: readonly LandingPageId[] = LANDING_PAGE_OPTIONS.map(
  (o) => o.id,
);

export type GalleryCardFields = {
  gallery_show_name: boolean;
  gallery_show_tags: boolean;
  gallery_show_price: boolean;
};

export const DEFAULT_GALLERY_CARD_FIELDS: GalleryCardFields = {
  gallery_show_name: DEFAULT_GALLERY_SHOW,
  gallery_show_tags: DEFAULT_GALLERY_SHOW,
  gallery_show_price: DEFAULT_GALLERY_SHOW,
};

export function landingPath(id: LandingPageId): string {
  return (
    LANDING_PAGE_OPTIONS.find((o) => o.id === id)?.path ??
    LANDING_PAGE_OPTIONS[0].path
  );
}

export function sanitizeListSort(raw: unknown): ListSortId {
  if (raw === "newest" || raw === "name" || raw === "created_at") return raw;
  return DEFAULT_LIST_SORT;
}

export function sanitizeGalleryLayout(raw: unknown): GalleryLayoutId {
  if (raw === "grid" || raw === "large" || raw === "list") return raw;
  return DEFAULT_GALLERY_LAYOUT;
}

export function sanitizeLandingPage(raw: unknown): LandingPageId {
  if (raw === "home" || raw === "gallery" || raw === "register") return raw;
  return DEFAULT_LANDING_PAGE;
}

export function sanitizeRegisterStartStep(raw: unknown): RegisterStartStepId {
  if (raw === "barcode" || raw === "photo" || raw === "confirm") return raw;
  return DEFAULT_REGISTER_START_STEP;
}

export function sanitizeDefaultStorageLocationId(raw: unknown): number | null {
  if (raw === null || raw === undefined || raw === "") return null;
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isInteger(n) || n < 1) return null;
  return n;
}

/** 未指定・不正は既定 true（現状カードと同じ） */
export function sanitizeGalleryShow(raw: unknown): boolean {
  if (typeof raw === "boolean") return raw;
  return DEFAULT_GALLERY_SHOW;
}

export function sanitizeGalleryCardFields(
  raw: Partial<Record<keyof GalleryCardFields, unknown>> | null | undefined,
): GalleryCardFields {
  return {
    gallery_show_name: sanitizeGalleryShow(raw?.gallery_show_name),
    gallery_show_tags: sanitizeGalleryShow(raw?.gallery_show_tags),
    gallery_show_price: sanitizeGalleryShow(raw?.gallery_show_price),
  };
}
