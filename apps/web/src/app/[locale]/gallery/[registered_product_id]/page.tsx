import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { redirectTo } from "@/i18n/redirect";
import { API_PATHS, type ProductTagSummary } from "@oshi/shared";
import { ProductDetailEditor } from "@/components/ProductDetailEditor";
import { ProductDetailHero } from "@/components/gallery/ProductDetailHero";
import { ProductDetailNeighborNav } from "@/components/gallery/ProductDetailNeighborNav";
import { FormattedAppDate } from "@/components/format/FormattedAppDate";
import { FormattedAppMoney } from "@/components/format/FormattedAppMoney";
import { ProductTagChip } from "@/components/tags/ProductTagChip";
import { apiFetch } from "@/lib/api";
import {
  galleryListHref,
  parseGalleryListQuery,
} from "@/lib/galleryListQuery";
import { getTranslations, setRequestLocale } from "next-intl/server";

type ExternalRef = {
  source: string;
  product_url: string;
  external_item_code?: string | null;
  shop_name?: string | null;
  label?: string | null;
  is_primary?: boolean;
};

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
  currency_code?: string | null;
  purchase_location?: string | null;
  works_series_name?: string | null;
  title?: string | null;
  category_tag?: ProductTagSummary | null;
  storage_location?: ProductTagSummary | null;
  color_tag_slots?: number[];
  external_refs?: ExternalRef[];
};

function pickPrimaryExternalRef(
  refs: ExternalRef[] | undefined,
): ExternalRef | null {
  if (!refs || refs.length === 0) return null;
  const primary = refs.find((r) => r.is_primary && r.product_url?.trim());
  if (primary) return primary;
  const first = refs.find((r) => r.product_url?.trim());
  return first ?? null;
}

function primaryLinkLabel(
  ref: ExternalRef,
  t: (key: string, values?: Record<string, string>) => string,
): string {
  if (ref.source === "rakuten") return t("openPrimaryLinkRakuten");
  const label = ref.label?.trim();
  if (label) return t("openPrimaryLinkWithLabel", { label });
  return t("openPrimaryLink");
}

export default async function GalleryDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; registered_product_id: string }>;
  searchParams: Promise<{
    q?: string;
    category_tag_id?: string;
    storage_location_id?: string;
    color_tag_slot?: string;
    offset?: string;
    sort?: string;
    v?: string;
  }>;
}) {
  const { locale, registered_product_id: idParam } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("ProductDetail");
  const tGallery = await getTranslations("Gallery");
  const tCommon = await getTranslations("Common");

  const listQuery = parseGalleryListQuery(await searchParams);
  const backHref = galleryListHref(listQuery);
  const id = Number(idParam);
  if (!Number.isFinite(id) || id <= 0) {
    notFound();
  }

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (!hasSupabase) {
    await redirectTo("/auth/login");
  }

  const { createClient } = await import("@/lib/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    await redirectTo("/auth/login");
  }
  const session = data.session!;

  let detail: ProductDetail | null = null;
  let loadError: string | null = null;
  try {
    detail = await apiFetch<ProductDetail>(
      `${API_PATHS.products}/${id}`,
      { accessToken: session.access_token },
    );
  } catch (e: unknown) {
    loadError =
      e instanceof Error ? e.message : tCommon("fetchFailed");
  }

  if (!detail && !loadError) {
    notFound();
  }

  const imageUrl =
    detail?.photo_high_resolution_url ||
    detail?.photo_thumbnail_url ||
    null;
  const primaryRef = pickPrimaryExternalRef(detail?.external_refs);
  const primaryUrl = primaryRef?.product_url?.trim() || null;

  return (
    <div className="stack-density">
      <Link
        href={backHref}
        className="text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        {t("back")}
      </Link>

      <ProductDetailNeighborNav
        registeredProductId={id}
        listQuery={listQuery}
      />

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {detail ? (
        <>
          <ProductDetailHero
            imageUrl={imageUrl}
            alt={detail.product_name?.trim() || t("photoAlt")}
            emptyLabel={tGallery("noImage")}
          />

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              {detail.product_name?.trim() ||
                tGallery("productFallback", {
                  id: detail.registered_product_id,
                })}
            </h1>
            <p className="text-sm text-muted-foreground">
              {detail.creation_date ? (
                <>
                  {t("registeredAtPrefix")}{" "}
                  <FormattedAppDate value={detail.creation_date} />
                </>
              ) : (
                t("registeredAtUnknown")
              )}
            </p>
            {detail.product_group_name ? (
              <p className="text-sm">
                {t("group", { name: detail.product_group_name })}
              </p>
            ) : null}
            {detail.character_name ? (
              <p className="text-sm">
                {t("character", { name: detail.character_name })}
              </p>
            ) : null}
            {detail.works_series_name ? (
              <p className="text-sm">
                {t("series", { name: detail.works_series_name })}
              </p>
            ) : null}
            {detail.title ? (
              <p className="text-sm">
                {t("titleField", { name: detail.title })}
              </p>
            ) : null}
            {detail.purchase_price != null ? (
              <p className="text-sm">
                {t("purchasePriceLabel")}:{" "}
                <FormattedAppMoney
                  value={detail.purchase_price}
                  currencyCode={detail.currency_code}
                />
              </p>
            ) : null}
            {detail.purchase_location ? (
              <p className="text-sm">
                {t("purchaseLocation", { name: detail.purchase_location })}
              </p>
            ) : null}
            {detail.barcode_number ? (
              <p className="text-sm">
                {t("barcode", { code: detail.barcode_number })}
              </p>
            ) : null}
            {detail.category_tag || detail.storage_location ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {detail.category_tag ? (
                  <ProductTagChip
                    name={detail.category_tag.name}
                    icon={detail.category_tag.icon}
                    color={detail.category_tag.color}
                    variant="category"
                  />
                ) : null}
                {detail.storage_location ? (
                  <ProductTagChip
                    name={detail.storage_location.name}
                    icon={detail.storage_location.icon}
                    variant="storage"
                  />
                ) : null}
              </div>
            ) : null}
            {detail.color_tag_slots && detail.color_tag_slots.length > 0 ? (
              <p className="text-sm">
                {t("colorSlots", {
                  slots: detail.color_tag_slots.join(", "),
                })}
              </p>
            ) : null}
            {detail.memo ? (
              <p className="text-sm whitespace-pre-wrap">{detail.memo}</p>
            ) : null}
            {primaryUrl && primaryRef ? (
              <p className="pt-2">
                <a
                  href={primaryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {primaryLinkLabel(primaryRef, t)}
                </a>
              </p>
            ) : null}
          </div>

          <details className="rounded-2xl border border-border bg-card p-4 open:shadow-sm">
            <summary className="cursor-pointer text-base font-medium">
              {t("editSummary")}
            </summary>
            <div className="mt-4">
              <ProductDetailEditor
                registeredProductId={id}
                galleryHref={backHref}
              />
            </div>
          </details>
        </>
      ) : null}
    </div>
  );
}
