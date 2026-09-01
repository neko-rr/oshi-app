import { API_PATHS, type MeResponse } from "@oshi/shared";
import { LogoutButton } from "@/components/logout-button";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MePage() {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!hasSupabase) {
    return (
      <div className="flex flex-col justify-center gap-4 py-10">
        <h1 className="text-2xl font-semibold">認証確認</h1>
        <p className="text-sm text-destructive">
          Supabase の公開設定（NEXT_PUBLIC_SUPABASE_URL /
          NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY）が未設定です。
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

  const accessToken = data.session.access_token;
  let apiMe: MeResponse | null = null;
  let apiError: string | null = null;
  try {
    apiMe = await apiFetch<MeResponse>(API_PATHS.me, { accessToken });
  } catch (e: unknown) {
    apiError =
      e instanceof Error
        ? e.message
        : "API の認証確認に失敗しました";
  }

  // 画面には JWT / Cookie を出さない。members_id とメールのみ。
  const sessionEmail = data.session.user.email ?? null;
  const sessionMembersId = data.session.user.id;

  return (
    <div className="flex flex-col justify-center gap-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">認証確認</h1>
        <LogoutButton />
      </div>

      <p className="text-sm text-muted-foreground">
        ログイン中のユーザー識別子です。アクセストークンは表示しません。
      </p>

      <div className="rounded-md border border-border bg-card p-4 text-sm text-card-foreground">
        <p>
          メール:{" "}
          <span className="font-medium">{sessionEmail ?? "（なし）"}</span>
        </p>
        <p className="mt-2 break-all">
          members_id:{" "}
          <code className="rounded bg-muted px-1 text-xs">{sessionMembersId}</code>
        </p>
      </div>

      <div className="rounded-md border border-border bg-card p-4 text-sm text-card-foreground">
        <p className="font-medium">API GET /me（JWKS 検証後）</p>
        {apiMe ? (
          <ul className="mt-2 space-y-1">
            <li className="break-all">
              members_id:{" "}
              <code className="rounded bg-muted px-1 text-xs">
                {apiMe.members_id}
              </code>
            </li>
            <li>email: {apiMe.email ?? "（なし）"}</li>
          </ul>
        ) : (
          <p className="mt-2 text-destructive">{apiError}</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/settings" className="underline-offset-4 hover:underline">
          設定へ
        </Link>
        <Link href="/" className="underline-offset-4 hover:underline">
          ホームへ
        </Link>
      </div>
    </div>
  );
}
