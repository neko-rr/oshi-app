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
        <h1 className="text-2xl font-semibold">認証確認 (/me)</h1>
        <p className="text-sm text-destructive">
          Supabase の NEXT_PUBLIC_* が未設定です。apps/web/.env.local に
          NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          を設定してください。
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
        : "API 呼び出しに失敗しました（Render/秘密設定は起きてからでも可）";
  }

  return (
    <div className="flex flex-col justify-center gap-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">認証確認 (/me)</h1>
        <LogoutButton />
      </div>
      <div className="rounded-md border border-border bg-card p-4 text-sm text-card-foreground">
        <p>
          Supabase session email:{" "}
          <strong>{data.session.user.email ?? "(none)"}</strong>
        </p>
        <p>
          members_id (sub): <code>{data.session.user.id}</code>
        </p>
      </div>
      <div className="rounded-md border border-border bg-card p-4 text-sm text-card-foreground">
        <p className="font-medium">FastAPI GET /me</p>
        {apiMe ? (
          <pre className="mt-2 overflow-auto text-xs">
            {JSON.stringify(apiMe, null, 2)}
          </pre>
        ) : (
          <p className="mt-2 text-destructive">{apiError}</p>
        )}
      </div>
      <Link href="/" className="underline">
        ホームへ
      </Link>
    </div>
  );
}
