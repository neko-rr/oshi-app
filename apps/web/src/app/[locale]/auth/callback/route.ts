import { redirect } from "next/navigation";
import { type NextRequest } from "next/server";

import { sanitizeAuthRedirectPath } from "@/lib/authRedirect";
import { createClient } from "@/lib/server";

/**
 * Google 等 OAuth の PKCE 戻り。code をセッション Cookie に交換する。
 * API 起床待ちは /auth/preparing のクライアント側で行う（Workers タイムアウト回避）。
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeAuthRedirectPath(searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const preparing = new URLSearchParams({ next });
      redirect(`/auth/preparing?${preparing.toString()}`);
    }
    redirect(`/auth/error?error=${encodeURIComponent(error.message)}`);
  }

  redirect(`/auth/error?error=${encodeURIComponent("No code")}`);
}
