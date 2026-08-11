import { API_PATHS, type MeResponse } from "@oshi/shared";
import { apiFetch } from "@/lib/api";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function MePage() {
  const hasSupabase =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY);

  if (!hasSupabase) {
    return (
      <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 px-4">
        <h1 className="text-2xl font-semibold">認証確認 (/me)</h1>
        <p className="text-sm text-amber-800">
          Supabase の NEXT_PUBLIC_* が未設定です。アプリ起動後に
          apps/web/.env.local を設定してください（起きてからの作業で可）。
        </p>
        <Link href="/" className="underline">
          ホームへ
        </Link>
      </main>
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
        : "API 呼び出しに失敗しました（Render/秘密設定は起きてからでも可）";
  }

  return (
    <main className="mx-auto flex min-h-svh max-w-lg flex-col justify-center gap-4 px-4">
      <h1 className="text-2xl font-semibold">認証確認 (/me)</h1>
      <div className="rounded border border-black/10 p-4 text-sm">
        <p>
          Supabase session email:{" "}
          <strong>{data.session.user.email ?? "(none)"}</strong>
        </p>
        <p>
          members_id (sub): <code>{data.session.user.id}</code>
        </p>
      </div>
      <div className="rounded border border-black/10 p-4 text-sm">
        <p className="font-medium">FastAPI GET /me</p>
        {apiMe ? (
          <pre className="mt-2 overflow-auto text-xs">
            {JSON.stringify(apiMe, null, 2)}
          </pre>
        ) : (
          <p className="mt-2 text-amber-800">{apiError}</p>
        )}
      </div>
      <Link href="/" className="underline">
        ホームへ
      </Link>
    </main>
  );
}
