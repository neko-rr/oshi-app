/** API パス定数（snake_case レスポンスと合わせて共有） */
export const API_PATHS = {
  health: "/health",
  me: "/me",
  products: "/products",
  productsBulk: "/products/bulk",
  photos: "/photos",
  colorTags: "/color-tags",
  categoryTags: "/category-tags",
  categoryTagsOrder: "/category-tags/order",
  categoryTagsRestorePreset: "/category-tags/restore-preset",
  storageLocations: "/storage-locations",
  storageLocationsOrder: "/storage-locations/order",
  storageLocationsRestorePreset: "/storage-locations/restore-preset",
  themeSettings: "/theme-settings",
  oshiAccentSettings: "/oshi-accent-settings",
  displaySettings: "/display-settings",
  galleryViews: "/gallery-views",
  exports: "/exports",
  statsProducts: "/stats/products",
  dashboardCharts: "/dashboard/charts",
  assistVisionDescribe: "/assist/vision/describe",
  assistTagsExtract: "/assist/tags/extract",
  assistBarcodeLookup: "/assist/barcode/lookup",
  assistBarcodeKeyword: "/assist/barcode/keyword",
} as const;

export type MeResponse = {
  members_id: string;
  email: string | null;
};

export type HealthResponse = {
  status: "ok";
};

/** GET /products の1件（一覧スライス） */
export type ProductTagSummary = {
  name: string;
  color?: string | null;
  icon?: string | null;
};

export type ProductListItem = {
  registered_product_id: number;
  product_name: string | null;
  barcode_number?: string | null;
  photo_id: number | null;
  photo_thumbnail_path: string | null;
  /** Storage signed URL（期限付き）。失敗時は null */
  photo_thumbnail_url: string | null;
  creation_date: string | null;
  purchase_price?: number | null;
  currency_code?: string | null;
  category_tag?: ProductTagSummary | null;
  storage_location?: ProductTagSummary | null;
};

export type ProductListResponse = {
  items: ProductListItem[];
  members_id: string;
  limit: number;
  offset: number;
  q?: string | null;
  /** barcode_number 完全一致フィルタ */
  barcode?: string | null;
  category_tag_ids?: number[];
  storage_location_ids?: number[];
  color_tag_slots?: number[];
  sort?: string | null;
  /** 取得件数が limit 以上なら次ページの可能性あり */
  has_more?: boolean;
};

/** GET /category-tags / GET /storage-locations */
export type TagMasterListResponse<TItem> = {
  items: TItem[];
  dismissed_preset_slots: number[];
};

export type CreateProductRequest = {
  product_name: string;
  photo_id?: number | null;
  barcode_number?: string | null;
  barcode_type?: string | null;
  memo?: string | null;
};

export type CreateProductResponse = {
  registered_product_id: number;
  product_name: string;
  photo_id: number | null;
};

export type CreatePhotoResponse = {
  photo_id: number;
  photo_thumbnail_path: string;
  photo_high_resolution_path: string;
};

export * from "./lucide_icon_catalog.js";
