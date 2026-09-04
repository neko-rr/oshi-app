import createMiddleware from "next-intl/middleware";
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/middleware";
import { routing } from "@/i18n/routing";

const handleI18nRouting = createMiddleware(routing);

/**
 * 1) 認証・Cookie 更新（locale 除去した論理パスで判定）
 * 2) next-intl の locale ルーティング
 * 認証 Redirect の Cookie を i18n レスポンスへ引き継ぐ。
 */
export async function middleware(request: NextRequest) {
  const authResponse = await updateSession(request);

  // 未ログイン Redirect や /dev 遮断はそのまま返す
  if (authResponse.headers.get("location")) {
    return authResponse;
  }

  const i18nResponse = handleI18nRouting(request);

  // Supabase が付けた Cookie を i18n 応答へコピー
  authResponse.cookies.getAll().forEach((cookie) => {
    i18nResponse.cookies.set(cookie.name, cookie.value);
  });

  return i18nResponse;
}

export const config = {
  matcher: [
    "/",
    "/(ja|en)/:path*",
    "/((?!_next|_vercel|.*\\..*).*)",
  ],
};
