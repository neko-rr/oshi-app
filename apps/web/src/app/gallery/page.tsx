import Link from "next/link";
import { redirect } from "next/navigation";
import { API_PATHS, type ProductListResponse } from "@oshi/shared";
import { apiFetch } from "@/lib/api";

export default async function GalleryPage() {
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
      list = await apiFetch<ProductListResponse>(API_PATHS.products, {
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
            GET /products（仮 UI。サムネは signed URL）
          </p>
        </div>
        <div className="flex gap-3 text-sm">
          <Link
            href="/register"
            className="text-primary underline-offset-4 hover:underline"
          >
            登録
          </Link>
          <Link href="/" className="underline-offset-4 hover:underline">
            ホーム
          </Link>
        </div>
      </div>

      {loadError ? (
        <p className="rounded-md border border-border bg-card p-4 text-sm text-destructive">
          {loadError}
        </p>
      ) : null}

      {!loadError && items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          まだ製品がありません。
        </p>
      ) : null}

      <ul className="grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.registered_product_id}>
            <Link
              href={`/gallery/${item.registered_product_id}`}
              className="block overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-sm transition hover:opacity-95"
            >
              <div className="aspect-square bg-muted">
                {item.photo_thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element -- signed URL はホストが可変
                  <img
                    src={item.photo_thumbnail_url}
                    alt={item.product_name?.trim() || "製品写真"}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
                    画像なし
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="font-medium">
                  {item.product_name?.trim() ||
                    `製品 #${item.registered_product_id}`}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  id: {item.registered_product_id}
                  {item.creation_date ? ` · ${item.creation_date}` : ""}
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
