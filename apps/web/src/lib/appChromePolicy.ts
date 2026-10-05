/**
 * 未ログインではアプリ本線ナビ（ギャラリー等）を出さない。
 */

export function shouldShowAppChromeNav(signedIn: boolean): boolean {
  return signedIn;
}

/** 下部タブを出さない経路。未ログインは常に隠す。 */
export function shouldHideBottomTabs(
  pathname: string,
  signedIn: boolean,
): boolean {
  if (!signedIn) return true;
  return pathname.startsWith("/auth") || pathname.startsWith("/dev");
}
