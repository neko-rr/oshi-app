/**
 * Web ルートの匿名アクセス方針（middleware 用・純関数）。
 *
 * Design Lab（/dev）はデザイン確認専用の見本 UI。
 * - 非本番: 未ログインで閲覧可（開発体験）
 * - 本番: ルート自体を出さない（別途 middleware / page で遮断）
 *
 * URL に `/en` などの locale プレフィックスが付く場合は、
 * 判定前に stripLocalePrefix で論理パスへ正規化する。
 */

/** 既定ロケール一覧（i18n/routing と揃える） */
export const APP_LOCALES = ["ja", "en"] as const;

/**
 * `/en/gallery` → `/gallery`、`/en` → `/`。
 * 未知の先頭セグメントはそのまま。
 */
export function stripLocalePrefix(
  path: string,
  locales: readonly string[] = APP_LOCALES,
): string {
  if (!path.startsWith("/")) return path;
  const segments = path.split("/");
  const maybeLocale = segments[1];
  if (!maybeLocale || !locales.includes(maybeLocale)) {
    return path === "" ? "/" : path;
  }
  const rest = segments.slice(2).join("/");
  return rest ? `/${rest}` : "/";
}

/** パス先頭が対応ロケールならそれを返す（なければ null＝既定ロケール想定） */
export function getLocaleFromPath(
  path: string,
  locales: readonly string[] = APP_LOCALES,
): string | null {
  if (!path.startsWith("/")) return null;
  const maybeLocale = path.split("/")[1];
  if (maybeLocale && locales.includes(maybeLocale)) return maybeLocale;
  return null;
}

/**
 * 論理パスに locale プレフィックスを付ける（既定 `ja` はプレフィックスなし）。
 */
export function withLocalePrefix(
  locale: string | null | undefined,
  path: string,
  defaultLocale = "ja",
): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (!locale || locale === defaultLocale) return normalized;
  if (normalized === "/") return `/${locale}`;
  return `/${locale}${normalized}`;
}

export function isDevOnlyPath(path: string): boolean {
  return path.startsWith("/dev");
}

/** 本番・開発を問わず匿名でよいパス（locale 除去後の論理パス想定） */
export function isAlwaysPublicPath(path: string): boolean {
  return (
    path.startsWith("/auth") ||
    path === "/privacy" ||
    path === "/licenses" ||
    path === "/" ||
    path.startsWith("/_next") ||
    path === "/favicon.ico"
  );
}

/**
 * 非本番で未ログインを許可するか。
 * /dev はデザイン確認のみ（業務 API・ユーザーデータは載せない前提）。
 */
export function allowsAnonymousWhenNotProduction(path: string): boolean {
  return isAlwaysPublicPath(path) || isDevOnlyPath(path);
}

/** 本番ビルドでは /dev を出さない */
export function shouldBlockDevPathInProduction(
  path: string,
  isProduction: boolean,
): boolean {
  return isProduction && isDevOnlyPath(path);
}
