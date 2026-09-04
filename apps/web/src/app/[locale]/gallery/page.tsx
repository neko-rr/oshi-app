import { Link } from "@/i18n/navigation";
import { redirectTo } from "@/i18n/redirect";
import {
  API_PATHS,
  type ProductListResponse,
  type TagMasterListResponse,
} from "@oshi/shared";
import { GalleryBrowse } from "@/components/gallery/GalleryBrowse";
import { GalleryFilterChips } from "@/components/gallery/GalleryFilterChips";
import { GallerySavedViewsBar } from "@/components/gallery/GallerySavedViewsBar";
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
import {
  galleryListHref,
  hasActiveGalleryFilters,
  parseGalleryListQuery,
  productsApiPath,
  withClearedFilters,
} from "@/lib/galleryListQuery";
import type { GalleryViewListResponse } from "@/lib/galleryViewQuery";
import { getTranslations, setRequestLocale } from "next-intl/server";

type CategoryTagItem = {
  category_tag_id: number;
  category_tag_name: string;
  category_tag_color?: string | null;
  category_tag_icon?: string | null;
};

type StorageLocationItem = {
  storage_location_id: number;
  storage_location_name: string;
  storage_location_icon?: string | null;
};

type ColorTagItem = {
  slot: number;
  color_tag_name: string;
  color_tag_color: string;
};

type DisplayPrefsSlice = {
  list_sort?: string;
  gallery_layout?: string;
  gallery_show_name?: boolean;
  gallery_show_tags?: boolean;
  gallery_show_price?: boolean;
};

const PAGE_LIMIT = 48;

export default async function GalleryPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    registered?: string;
    category_tag_id?: string;
    storage_location_id?: string;
    color_tag_slot?: string;
    offset?: string;
    sort?: string;
    v?: string;
  }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Gallery");

  const sp = await searchParams;
  const listQuery = parseGalleryListQuery(sp);

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const hasApi = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

  if (!hasSupabase) {
    return (
      <div className="stack-density">
        <h1 className="text-3xl font-semibold">{t("titleFallback")}</h1>
        <p className="text-sm text-muted-foreground">{t("supabaseMissing")}</p>
        <Link href="/" className="underline">
          {t("homeLink")}
        </Link>
      </div>
    );
  }

  const { createClient } = await import("@/lib/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    await redirectTo("/auth/login");
  }
  const session = data.session!;

  let list: ProductListResponse | null = null;
  let categories: CategoryTagItem[] = [];
  let storageLocations: StorageLocationItem[] = [];
  let colorTags: ColorTagItem[] = [];
  let savedViews: GalleryViewListResponse["items"] = [];
  let loadError: string | null = null;
  let listSort: ListSortId = DEFAULT_LIST_SORT;
  let galleryLayout: GalleryLayoutId = DEFAULT_GALLERY_LAYOUT;
  let cardFields: GalleryCardFields = DEFAULT_GALLERY_CARD_FIELDS;

  if (!hasApi) {
    loadError = t("apiBaseMissing");
  } else {
    try {
      const token = session.access_token;
      const prefs = await apiFetch<DisplayPrefsSlice>(
        API_PATHS.displaySettings,
        { accessToken: token },
      ).catch(() => null);
      listSort = sanitizeListSort(prefs?.list_sort ?? listQuery.sort);
      galleryLayout = sanitizeGalleryLayout(prefs?.gallery_layout);
      cardFields = sanitizeGalleryCardFields(prefs);
      const effectiveQuery = {
        ...listQuery,
        sort: listQuery.sort ?? listSort,
        offset: 0,
        limit: PAGE_LIMIT,
      };
      const [productList, catList, storageList, colorList, viewList] =
        await Promise.all([
          apiFetch<ProductListResponse>(productsApiPath(effectiveQuery), {
            accessToken: token,
          }),
          apiFetch<TagMasterListResponse<CategoryTagItem>>(
            API_PATHS.categoryTags,
            { accessToken: token },
          ).catch(() => ({ items: [] as CategoryTagItem[] })),
          apiFetch<TagMasterListResponse<StorageLocationItem>>(
            API_PATHS.storageLocations,
            { accessToken: token },
          ).catch(() => ({ items: [] as StorageLocationItem[] })),
          apiFetch<TagMasterListResponse<ColorTagItem>>(API_PATHS.colorTags, {
            accessToken: token,
          }).catch(() => ({ items: [] as ColorTagItem[] })),
          apiFetch<GalleryViewListResponse>(API_PATHS.galleryViews, {
            accessToken: token,
          }).catch(() => ({ items: [] as GalleryViewListResponse["items"] })),
        ]);
      list = productList;
      categories = catList.items ?? [];
      storageLocations = storageList.items ?? [];
      colorTags = colorList.items ?? [];
      savedViews = viewList.items ?? [];
    } catch (e: unknown) {
      loadError =
        e instanceof Error ? e.message : t("listLoadFailed");
    }
  }

  const items = list?.items ?? [];
  const hasMore = Boolean(list?.has_more);
  const browseQuery = {
    ...listQuery,
    sort: listQuery.sort ?? listSort,
    offset: 0,
  };
  const fetchQuery = { ...browseQuery, limit: PAGE_LIMIT };
  const hasFilters = hasActiveGalleryFilters(listQuery);

  return (
    <div className="stack-density-lg">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link
          href="/register"
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-95"
        >
          {t("registerCta")}
        </Link>
      </div>

      <ProductSearchForm
        actionPath="/gallery"
        initialQuery={listQuery.q ?? ""}
        preserveFilters={{
          category_tag_ids: listQuery.category_tag_ids,
          storage_location_ids: listQuery.storage_location_ids,
          color_tag_slots: listQuery.color_tag_slots,
          sort: browseQuery.sort,
        }}
      />

      <GallerySavedViewsBar
        listQuery={browseQuery}
        effectiveSort={browseQuery.sort ?? DEFAULT_LIST_SORT}
        initialViews={savedViews}
      />

      <GalleryFilterChips
        listQuery={browseQuery}
        effectiveSort={browseQuery.sort ?? DEFAULT_LIST_SORT}
        categories={categories.map((c) => ({
          id: c.category_tag_id,
          name: c.category_tag_name,
        }))}
        storageLocations={storageLocations.map((s) => ({
          id: s.storage_location_id,
          name: s.storage_location_name,
        }))}
        colorTags={colorTags
          .filter((c) => (c.color_tag_name || "").trim().length > 0)
          .map((c) => ({
            slot: c.slot,
            name: c.color_tag_name,
            color: c.color_tag_color,
          }))}
      />

      {sp.registered ? (
        <p className="rounded-xl bg-accent/40 px-3 py-2 text-sm text-foreground">
          {t("registeredBanner", { id: sp.registered })}
        </p>
      ) : null}

      {loadError ? (
        <p className="rounded-xl border border-border bg-card p-4 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {!loadError && items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            {hasFilters ? t("emptyFiltered") : t("empty")}
          </p>
          {hasFilters ? (
            <Link
              href={galleryListHref(withClearedFilters(browseQuery))}
              className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              {t("clearFilters")}
            </Link>
          ) : (
            <Link
              href="/register"
              className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              {t("registerLink")}
            </Link>
          )}
        </div>
      ) : null}

      {!loadError && items.length > 0 ? (
        <GalleryBrowse
          key={productsApiPath(fetchQuery)}
          initialItems={items}
          initialHasMore={hasMore}
          limit={PAGE_LIMIT}
          listQuery={browseQuery}
          galleryLayout={galleryLayout}
          cardFields={cardFields}
          storageOptions={storageLocations.map((s) => ({
            id: s.storage_location_id,
            name: s.storage_location_name,
            icon: s.storage_location_icon,
          }))}
          categoryOptions={categories.map((c) => ({
            id: c.category_tag_id,
            name: c.category_tag_name,
            icon: c.category_tag_icon,
            color: c.category_tag_color,
          }))}
        />
      ) : null}
    </div>
  );
}
