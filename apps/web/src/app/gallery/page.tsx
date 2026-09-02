import Link from "next/link";
import { redirect } from "next/navigation";
import {
  API_PATHS,
  type ProductListResponse,
  type TagMasterListResponse,
} from "@oshi/shared";
import { GalleryBrowse } from "@/components/gallery/GalleryBrowse";
import { GalleryFilterChips } from "@/components/gallery/GalleryFilterChips";
import { ProductSearchForm } from "@/components/ProductSearchForm";
import { apiFetch } from "@/lib/api";
import {
  parseGalleryListQuery,
  productsApiPath,
} from "@/lib/galleryListQuery";

type CategoryTagItem = {
  category_tag_id: number;
  category_tag_name: string;
};

type StorageLocationItem = {
  storage_location_id: number;
  storage_location_name: string;
};

const PAGE_LIMIT = 48;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    registered?: string;
    category_tag_id?: string;
    storage_location_id?: string;
    offset?: string;
  }>;
}) {
  const params = await searchParams;
  const listQuery = parseGalleryListQuery(params);
  // 初回表示は offset 0 から（もっと見るはクライアントで追加）
  const fetchQuery = { ...listQuery, offset: 0, limit: PAGE_LIMIT };

  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const hasApi = Boolean(process.env.NEXT_PUBLIC_API_BASE_URL);

  if (!hasSupabase) {
    return (
      <div className="flex flex-col gap-4 py-6">
        <h1 className="text-3xl font-semibold">ギャラリー</h1>
        <p className="text-sm text-muted-foreground">
          Supabase の NEXT_PUBLIC_* を設定すると一覧を表示できます。
        </p>
        <Link href="/" className="underline">
          ホームへ
        </Link>
      </div>
    );
  }

  const { createClient } = await import("@/lib/server");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    redirect("/auth/login");
  }

  let list: ProductListResponse | null = null;
  let categories: CategoryTagItem[] = [];
  let storageLocations: StorageLocationItem[] = [];
  let loadError: string | null = null;

  if (!hasApi) {
    loadError = "NEXT_PUBLIC_API_BASE_URL が未設定です";
  } else {
    try {
      const token = data.session.access_token;
      const [productList, catList, storageList] = await Promise.all([
        apiFetch<ProductListResponse>(productsApiPath(fetchQuery), {
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
      ]);
      list = productList;
      categories = catList.items ?? [];
      storageLocations = storageList.items ?? [];
    } catch (e: unknown) {
      loadError =
        e instanceof Error
          ? e.message
          : "製品一覧の取得に失敗しました（API / Supabase 設定を確認）";
    }
  }

  const items = list?.items ?? [];
  const hasMore = Boolean(list?.has_more);
  const hasFilters = Boolean(
    listQuery.q ||
      listQuery.category_tag_id ||
      listQuery.storage_location_id,
  );

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            わたしのコレクション
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            写真をひらいて、推しの記憶をつなぐ
          </p>
        </div>
        <Link
          href="/register"
          className="inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:opacity-95"
        >
          登録する
        </Link>
      </div>

      <ProductSearchForm
        actionPath="/gallery"
        initialQuery={listQuery.q ?? ""}
        preserveFilters={{
          category_tag_id: listQuery.category_tag_id,
          storage_location_id: listQuery.storage_location_id,
        }}
      />

      <GalleryFilterChips
        listQuery={listQuery}
        categories={categories.map((c) => ({
          id: c.category_tag_id,
          name: c.category_tag_name,
        }))}
        storageLocations={storageLocations.map((s) => ({
          id: s.storage_location_id,
          name: s.storage_location_name,
        }))}
      />

      {params.registered ? (
        <p className="rounded-xl bg-accent/40 px-3 py-2 text-sm text-foreground">
          製品 #{params.registered} を登録しました。
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
            {hasFilters
              ? "条件に一致する製品はありません。"
              : "まだ製品がありません。登録から追加できます。"}
          </p>
          {hasFilters ? (
            <Link
              href="/gallery"
              className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              条件をクリア
            </Link>
          ) : (
            <Link
              href="/register"
              className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              製品を登録する
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
          listQuery={{ ...listQuery, offset: 0 }}
        />
      ) : null}
    </div>
  );
}
