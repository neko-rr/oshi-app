/** ブラウザで共有するログイン状態。サーバー認可には使わない。 */
export type BrowserSessionSnapshot = {
  status: "loading" | "ready";
  accessToken: string | null;
  isAnonymous: boolean;
};

export const LOADING_BROWSER_SESSION: BrowserSessionSnapshot = {
  status: "loading",
  accessToken: null,
  isAnonymous: false,
};

export function sameBrowserSession(
  a: BrowserSessionSnapshot,
  b: BrowserSessionSnapshot,
): boolean {
  return (
    a.status === b.status &&
    a.accessToken === b.accessToken &&
    a.isAnonymous === b.isAnonymous
  );
}

/** Supabase の session から、画面が使う最小情報だけを取る。 */
export function readBrowserSession(
  session: {
    access_token?: string | null;
    user?: { is_anonymous?: boolean | null } | null;
  } | null | undefined,
): BrowserSessionSnapshot {
  const accessToken = session?.access_token?.trim() || null;
  if (!accessToken) {
    return { status: "ready", accessToken: null, isAnonymous: false };
  }
  return {
    status: "ready",
    accessToken,
    isAnonymous: session?.user?.is_anonymous === true,
  };
}
