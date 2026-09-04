import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  allowsAnonymousWhenNotProduction,
  getLocaleFromPath,
  shouldBlockDevPathInProduction,
  stripLocalePrefix,
  withLocalePrefix,
} from "@/lib/auth-path-policy";

/** ローカル骨格用。本番では無効。AUTH_GATE_BYPASS=1 のときのみ認証ゲートを緩める */
function authGateBypassAllowed(): boolean {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.AUTH_GATE_BYPASS === "1"
  );
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const rawPath = request.nextUrl.pathname;
  const locale = getLocaleFromPath(rawPath);
  const path = stripLocalePrefix(rawPath);
  const isProduction = process.env.NODE_ENV === "production";

  // Design Lab 等は本番では公開しない（デザイン確認専用・開発時のみ）
  if (shouldBlockDevPathInProduction(path, isProduction)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = withLocalePrefix(locale, "/");
    return NextResponse.redirect(redirectUrl);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    // 明示フラグなしでは保護ルートを通さない（本番相当の穴を塞ぐ）
    if (authGateBypassAllowed()) {
      return supabaseResponse;
    }
    // 非本番の /dev はデザイン確認用に匿名可
    if (!allowsAnonymousWhenNotProduction(path)) {
      const redirectUrl = request.nextUrl.clone();
      redirectUrl.pathname = withLocalePrefix(locale, "/auth/login");
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  // Fluid compute: リクエストごとに新規クライアント
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // createServerClient と getClaims の間に他処理を置かない
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  // 非本番 /dev は未ログインでも可（見本 UI のみ。業務データは載せない）
  if (!user && !allowsAnonymousWhenNotProduction(path)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = withLocalePrefix(locale, "/auth/login");
    return NextResponse.redirect(redirectUrl);
  }

  return supabaseResponse;
}
