import Link from "next/link";
import { redirect } from "next/navigation";
import { API_PATHS, type ProductListResponse } from "@oshi/shared";
import { ProductGalleryGrid } from "@/components/ProductGalleryGrid";
import { ProductSearchForm } from "@/components/ProductSearchForm";
import { apiFetch } from "@/lib/api";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; registered?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();

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
  let loadError: string | null = null;

  if (!hasApi) {
    loadError = "NEXT_PUBLIC_API_BASE_URL が未設定です";
  } else {
    try {
      const path = q
        ? `${API_PATHS.products}?q=${encodeURIComponent(q)}`
        : API_PATHS.products;
      list = await apiFetch<ProductListResponse>(path, {
        accessToken: data.session.access_token,
      });
    } catch (e: unknown) {
      loadError =
        e instanceof Error
          ? e.message
          : "製品一覧の取得に失敗しました（API / Supabase 設定を確認）";
    }
  }

  const items = list?.items ?? [];

  return (
    <div className="flex flex-col gap-6 py-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">ギャラリー</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            登録したグッズの一覧です。カードから詳細を開けます。
          </p>
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link
            href="/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            登録
          </Link>
          <Link
            href="/search"
            className="underline-offset-4 hover:underline"
          >
            検索
          </Link>
          <Link href="/" className="underline-offset-4 hover:underline">
            ホーム
          </Link>
        </div>
      </div>

      <ProductSearchForm actionPath="/gallery" initialQuery={q} />

      {params.registered ? (
        <p className="rounded-md border border-border bg-card px-3 py-2 text-sm text-card-foreground">
          製品 #{params.registered} を登録しました。
        </p>
      ) : null}

      {loadError ? (
        <p className="rounded-md border border-border bg-card p-4 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {!loadError && items.length === 0 ? (
        <div className="rounded-md border border-dashed border-border px-4 py-8 text-center">
          <p className="text-sm text-muted-foreground">
            {q
              ? `「${q}」に一致する製品はありません。`
              : "まだ製品がありません。登録から追加できます。"}
          </p>
          {!q ? (
            <Link
              href="/register"
              className="mt-3 inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              製品を登録する
            </Link>
          ) : null}
        </div>
      ) : null}

      <ProductGalleryGrid items={items} />
    </div>
  );
}
