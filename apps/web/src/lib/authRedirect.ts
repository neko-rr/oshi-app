/**
 * Auth リダイレクト先のサニタイズと Google OAuth の callback URL。
 */

/** 相対パスのみ許可（オープンリダイレクト防止）。locale 付きも可。 */
export function sanitizeAuthRedirectPath(
  next: string | null | undefined,
): string {
  if (!next) return "/";

  let path = next.trim();
  // %2F 等のエンコードで // や :// をすり抜けるのを防ぐ
  try {
    path = decodeURIComponent(path);
  } catch {
    return "/";
  }
  path = path.trim();

  if (!path.startsWith("/") || path.startsWith("//")) {
    return "/";
  }
  if (path.includes("://") || path.includes("\\")) {
    return "/";
  }
  // 残ったエンコード済みスラッシュ／バックスラッシュも拒否
  if (/%2f|%5c/i.test(path)) {
    return "/";
  }
  // パス走査（/../）を拒否
  const segments = path.split("/");
  if (segments.some((seg) => seg === "..")) {
    return "/";
  }
  return path;
}

/** /auth/preparing へのループを防いだ着地パス。 */
export function sanitizePreparingNext(
  next: string | null | undefined,
): string {
  const path = sanitizeAuthRedirectPath(next);
  if (path === "/auth/preparing" || path.startsWith("/auth/preparing?")) {
    return "/";
  }
  if (path === "/en/auth/preparing" || path.startsWith("/en/auth/preparing?")) {
    return "/";
  }
  return path;
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
