import { Link } from "@/i18n/navigation";
import { redirectTo } from "@/i18n/redirect";
import { API_PATHS, type ProductListResponse } from "@oshi/shared";
import { ProductGalleryGrid } from "@/components/ProductGalleryGrid";
import { GalleryRecentFilters } from "@/components/gallery/GalleryRecentFilters";
import { ProductSearchForm } from "@/components/ProductSearchForm";
import { apiFetch } from "@/lib/api";
import { isAnonymousUser } from "@/lib/authGuest";
import {
  DEFAULT_GALLERY_CARD_FIELDS,
  DEFAULT_GALLERY_IMAGE_FIT,
  DEFAULT_GALLERY_LAYOUT,
  DEFAULT_LIST_SORT,
  sanitizeGalleryCardFields,
  sanitizeGalleryImageFit,
  sanitizeGalleryLayout,
  sanitizeListSort,
  type GalleryCardFields,
  type GalleryImageFitId,
  type GalleryLayoutId,
  type ListSortId,
} from "@/lib/displayPrefs";
import { productsApiPath } from "@/lib/galleryListQuery";
import { getTranslations, setRequestLocale } from "next-intl/server";

type DisplayPrefsSlice = {
  list_sort?: string;
  gallery_layout?: string;
  gallery_image_fit?: string;
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
  const isGuest = isAnonymousUser(session.user);

  let list: ProductListResponse | null = null;
  let loadError: string | null = null;
  let listSort: ListSortId = DEFAULT_LIST_SORT;
  let galleryLayout: GalleryLayoutId = DEFAULT_GALLERY_LAYOUT;
  let galleryImageFit: GalleryImageFitId = DEFAULT_GALLERY_IMAGE_FIT;
  let cardFields: GalleryCardFields = DEFAULT_GALLERY_CARD_FIELDS;

  if (!isGuest) {
    try {
      const prefs = await apiFetch<DisplayPrefsSlice>(
        API_PATHS.displaySettings,
        { accessToken: session.access_token },
      ).catch(() => null);
      listSort = sanitizeListSort(prefs?.list_sort);
      galleryLayout = sanitizeGalleryLayout(prefs?.gallery_layout);
      galleryImageFit = sanitizeGalleryImageFit(prefs?.gallery_image_fit);
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
  }

  const items = list?.items ?? [];

  return (
    <div className="stack-density-lg">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      {isGuest ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">{t("emptyGuest")}</p>
          <Link
            href="/auth/upgrade"
            className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
          >
            {t("upgradeLink")}
          </Link>
        </div>
      ) : (
        <>
          <ProductSearchForm initialQuery={q} />

          <GalleryRecentFilters
            listQuery={q ? { q } : {}}
            titleKey="search"
          />

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
            listQuery={q ? { q } : {}}
            layout={galleryLayout}
            imageFit={galleryImageFit}
            rememberBrowseOrder
            cardFields={cardFields}
          />
        </>
      )}

      <Link
        href="/gallery"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        {t("toGallery")}
      </Link>
    </div>
  );
}
