/**
 * Web ルートの匿名アクセス方針（middleware 用・純関数）。
 *
 * Design Lab（/dev）はデザイン確認専用の見本 UI。
 * - 非本番: 未ログインで閲覧可（開発体験）
 * - 本番: ルート自体を出さない（別途 middleware / page で遮断）
 */

export function isDevOnlyPath(path: string): boolean {
  return path.startsWith("/dev");
}

/** 本番・開発を問わず匿名でよいパス */
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
