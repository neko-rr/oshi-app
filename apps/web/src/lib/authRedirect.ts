/**
 * Auth リダイレクト先のサニタイズと Google OAuth の callback URL。
 */

/** 相対パスのみ許可（オープンリダイレクト防止）。locale 付きも可。 */
export function sanitizeAuthRedirectPath(
  next: string | null | undefined,
): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }
  if (next.includes("://")) {
    return "/";
  }
  return next;
}

/** ja はプレフィックスなし。en は /en。Google Cloud の URI ではなくアプリ側 redirectTo。 */
export function googleOAuthCallbackUrl(
  origin: string,
  locale: string | null | undefined,
  next?: string | null,
): string {
  const base = origin.replace(/\/$/, "");
  const prefix = locale === "en" ? "/en" : "";
  const url = new URL(`${prefix}/auth/callback`, `${base}/`);
  url.searchParams.set("next", sanitizeAuthRedirectPath(next));
  return url.toString();
}
