import Link from "next/link";
import { redirect } from "next/navigation";
import { API_PATHS, type ProductListResponse } from "@oshi/shared";
import { ProductGalleryGrid } from "@/components/ProductGalleryGrid";
import { ProductSearchForm } from "@/components/ProductSearchForm";
import { apiFetch } from "@/lib/api";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q ?? "").trim();

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

  let list: ProductListResponse | null = null;
  let loadError: string | null = null;

  if (q) {
    try {
      list = await apiFetch<ProductListResponse>(
        `${API_PATHS.products}?q=${encodeURIComponent(q)}`,
        { accessToken: data.session.access_token },
      );
    } catch (e: unknown) {
      loadError =
        e instanceof Error ? e.message : "検索結果の取得に失敗しました";
    }
  }

  const items = list?.items ?? [];

  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">検索</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          製品名・カテゴリ・収納場所で絞り込みます（自分のデータのみ）。
        </p>
      </div>

      <ProductSearchForm initialQuery={q} />

      {loadError ? (
        <p className="text-sm text-destructive">{loadError}</p>
      ) : null}

      {!q ? (
        <p className="text-sm text-muted-foreground">
          キーワードを入力して検索してください。
        </p>
      ) : null}

      {q && !loadError && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          「{q}」に一致する製品はありません。
        </p>
      ) : null}

      <ProductGalleryGrid items={items} />

      <Link
        href="/gallery"
        className="text-sm text-primary underline-offset-4 hover:underline"
      >
        ギャラリー一覧へ
      </Link>
    </div>
  );
}
