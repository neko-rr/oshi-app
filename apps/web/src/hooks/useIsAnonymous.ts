"use client";

import { useBrowserSession } from "@/components/auth/BrowserSessionProvider";

/**
 * ゲストかどうか。読込中と未ログインは null。
 * 画面ごとの getSession は使わない。
 */
export function useIsAnonymous(): boolean | null {
  const session = useBrowserSession();
  if (session.status !== "ready" || !session.accessToken) return null;
  return session.isAnonymous;
}
