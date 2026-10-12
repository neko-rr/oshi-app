"use client";

import { useBrowserSession } from "@/components/auth/BrowserSessionProvider";

/** セッションの有無。読込中は null。 */
export function useHasSession(): boolean | null {
  const session = useBrowserSession();
  if (session.status !== "ready") return null;
  return Boolean(session.accessToken);
}
