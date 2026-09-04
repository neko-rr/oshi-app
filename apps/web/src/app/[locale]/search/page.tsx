import { Link } from "@/i18n/navigation";
import { redirectTo } from "@/i18n/redirect";
import { API_PATHS, type ProductListResponse } from "@oshi/shared";
import { ProductGalleryGrid } from "@/components/ProductGalleryGrid";
import { ProductSearchForm } from "@/components/ProductSearchForm";
import { apiFetch } from "@/lib/api";
import {
  DEFAULT_GALLERY_CARD_FIELDS,
  DEFAULT_GALLERY_LAYOUT,
  DEFAULT_LIST_SORT,
  sanitizeGalleryCardFields,
  sanitizeGalleryLayout,
  sanitizeListSort,
  type GalleryCardFields,
  type GalleryLayoutId,
  type ListSortId,
} from "@/lib/displayPrefs";
import { productsApiPath } from "@/lib/galleryListQuery";
import { getTranslations, setRequestLocale } from "next-intl/server";

type DisplayPrefsSlice = {
  list_sort?: string;
  gallery_layout?: string;
  gallery_show_name?: boolean;
  gallery_show_tags?: boolean;
  gallery_show_price?: boolean;
};

export default async function SearchPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Search");

  const sp = await searchParams;
  const q = (sp.q ?? "").trim();

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

  let list: ProductListResponse | null = null;
  let loadError: string | null = null;
  let listSort: ListSortId = DEFAULT_LIST_SORT;
  let galleryLayout: GalleryLayoutId = DEFAULT_GALLERY_LAYOUT;
  let cardFields: GalleryCardFields = DEFAULT_GALLERY_CARD_FIELDS;

  try {
    const prefs = await apiFetch<DisplayPrefsSlice>(
      API_PATHS.displaySettings,
      { accessToken: session.access_token },
    ).catch(() => null);
    listSort = sanitizeListSort(prefs?.list_sort);
    galleryLayout = sanitizeGalleryLayout(prefs?.gallery_layout);
    cardFields = sanitizeGalleryCardFields(prefs);
  } catch {
    /* 既定のまま */
  }

  if (q) {
    try {
      list = await apiFetch<ProductListResponse>(
        productsApiPath({ q, sort: listSort, limit: 48 }),
        { accessToken: session.access_token },
      );
    } catch (e: unknown) {
      loadError =
        e instanceof Error ? e.message : t("loadFailed");
    }
  }

  const items = list?.items ?? [];

  return (
    <div className="stack-density-lg">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <ProductSearchForm initialQuery={q} />

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {!q ? (
        <p className="text-sm text-muted-foreground">{t("prompt")}</p>
      ) : null}

      {q && !loadError && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {t("noResults", { q })}
        </p>
      ) : null}

      <ProductGalleryGrid
        items={items}
        layout={galleryLayout}
        cardFields={cardFields}
      />

      <Link
        href="/gallery"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        {t("toGallery")}
      </Link>
    </div>
  );
}
