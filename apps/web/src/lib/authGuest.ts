/** ゲスト（Anonymous）判定の純関数・共有ヘルパ。 */

export function isAnonymousUser(user: {
  is_anonymous?: boolean | null;
} | null | undefined): boolean {
  return user?.is_anonymous === true;
}

/**
 * 見た目・表示設定などを FastAPI へ同期してよいか。
 * 未ログイン・ゲストは端末 localStorage のみ（API は 403）。
 */
export function canSyncUserPrefsToServer(user: {
  is_anonymous?: boolean | null;
} | null | undefined): boolean {
  if (!user) return false;
  return !isAnonymousUser(user);
}
