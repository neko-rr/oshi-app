import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { API_PATHS } from "@oshi/shared";
import { ProductDetailEditor } from "@/components/ProductDetailEditor";
import { apiFetch } from "@/lib/api";

type ProductDetail = {
  registered_product_id: number;
  product_name: string | null;
  photo_thumbnail_url: string | null;
  photo_high_resolution_url: string | null;
  creation_date: string | null;
  memo: string | null;
  barcode_number: string | null;
  product_group_name?: string | null;
  character_name?: string | null;
  purchase_price?: number | null;
  purchase_location?: string | null;
  works_series_name?: string | null;
  title?: string | null;
  category_tag?: {
    category_tag_name?: string;
    category_tag_color?: string;
  } | null;
  storage_location?: {
    storage_location_name?: string;
  } | null;
  color_tag_slots?: number[];
};

export default async function GalleryDetailPage({
  params,
}: {
  params: Promise<{ registered_product_id: string }>;
}) {
  const { registered_product_id: idParam } = await params;
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!hasSupabase) {
    redirect("/auth/login");
  }

  const { createClient } = await import("@/lib/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    redirect("/auth/login");
  }

  let detail: ProductDetail | null = null;
  let loadError: string | null = null;
  try {
    detail = await apiFetch<ProductDetail>(
      `${API_PATHS.products}/${id}`,
      { accessToken: data.session.access_token },
    );
  } catch (e: unknown) {
    loadError = e instanceof Error ? e.message : "取得に失敗しました";
  }

  if (!detail && !loadError) {
    notFound();
  }

  const imageUrl =
    detail?.photo_high_resolution_url || detail?.photo_thumbnail_url;

  return (
    <div className="flex flex-col gap-6 py-6">
      <Link
        href="/gallery"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        ← ギャラリー
      </Link>

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {detail ? (
        <>
          <div className="overflow-hidden rounded-lg border border-border bg-card">
            <div className="aspect-square max-h-[28rem] bg-muted sm:aspect-auto sm:h-80">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt={detail.product_name?.trim() || "製品写真"}
                  className="h-full w-full object-contain"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  画像なし
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {detail.product_name?.trim() ||
                `製品 #${detail.registered_product_id}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {detail.creation_date
                ? `登録日: ${detail.creation_date}`
                : "登録日不明"}
            </p>
            {detail.product_group_name ? (
              <p className="text-sm">グループ: {detail.product_group_name}</p>
            ) : null}
            {detail.character_name ? (
              <p className="text-sm">キャラクター: {detail.character_name}</p>
            ) : null}
            {detail.works_series_name ? (
              <p className="text-sm">作品/シリーズ: {detail.works_series_name}</p>
            ) : null}
            {detail.title ? (
              <p className="text-sm">タイトル: {detail.title}</p>
            ) : null}
            {detail.purchase_price != null ? (
              <p className="text-sm">購入価格: {detail.purchase_price}</p>
            ) : null}
            {detail.purchase_location ? (
              <p className="text-sm">購入場所: {detail.purchase_location}</p>
            ) : null}
            {detail.barcode_number ? (
              <p className="text-sm">バーコード: {detail.barcode_number}</p>
            ) : null}
            {detail.category_tag?.category_tag_name ? (
              <p className="text-sm">
                カテゴリー: {detail.category_tag.category_tag_name}
              </p>
            ) : null}
            {detail.storage_location?.storage_location_name ? (
              <p className="text-sm">
                収納場所: {detail.storage_location.storage_location_name}
              </p>
            ) : null}
            {detail.color_tag_slots && detail.color_tag_slots.length > 0 ? (
              <p className="text-sm">
                カラースロット: {detail.color_tag_slots.join(", ")}
              </p>
            ) : null}
            {detail.memo ? (
              <p className="text-sm whitespace-pre-wrap">{detail.memo}</p>
            ) : null}
          </div>

          <ProductDetailEditor registeredProductId={id} />
        </>
      ) : null}
    </div>
  );
}
