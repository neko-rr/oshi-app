/** API パス定数（snake_case レスポンスと合わせて共有） */
export const API_PATHS = {
  health: "/health",
  me: "/me",
  products: "/products",
  photos: "/photos",
  colorTags: "/color-tags",
  categoryTags: "/category-tags",
  storageLocations: "/storage-locations",
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
export type ProductListItem = {
  registered_product_id: number;
  product_name: string | null;
  photo_id: number | null;
  photo_thumbnail_path: string | null;
  /** Storage signed URL（期限付き）。失敗時は null */
  photo_thumbnail_url: string | null;
  creation_date: string | null;
};

export type ProductListResponse = {
  items: ProductListItem[];
  members_id: string;
  limit: number;
  offset: number;
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
