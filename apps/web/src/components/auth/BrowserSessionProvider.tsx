"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/client";
import {
  LOADING_BROWSER_SESSION,
  readBrowserSession,
  sameBrowserSession,
  type BrowserSessionSnapshot,
} from "@/lib/browserSession";
import { getClientE2eStubSession } from "@/lib/e2eAuthStub";
import { runAfterTick } from "@/lib/runAfterTick";

const BrowserSessionContext = createContext<BrowserSessionSnapshot | null>(
  null,
);

/**
 * ブラウザのログイン状態を1回だけ購読する。
 * getSession を画面ごとに足すと、期限間近の更新で全部が順番待ちになる。
 */
export function BrowserSessionProvider({ children }: { children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<BrowserSessionSnapshot>(
    LOADING_BROWSER_SESSION,
  );

  useEffect(() => {
    const stub = getClientE2eStubSession();
    if (stub) {
      return runAfterTick(() => {
        setSnapshot({
          status: "ready",
          accessToken: stub.accessToken,
          isAnonymous: stub.isAnonymous,
        });
      });
    }

    let unsubscribe = () => {};
    const cancelTick = runAfterTick(() => {
      try {
        const supabase = createClient();
        const { data } = supabase.auth.onAuthStateChange((_event, session) => {
          setSnapshot((prev) => {
            const next = readBrowserSession(session);
            return sameBrowserSession(prev, next) ? prev : next;
          });
        });
        unsubscribe = () => data.subscription.unsubscribe();
      } catch {
        setSnapshot({
          status: "ready",
          accessToken: null,
          isAnonymous: false,
        });
      }
    });
    return () => {
      cancelTick();
      unsubscribe();
    };
  }, []);

  return (
    <BrowserSessionContext.Provider value={snapshot}>
      {children}
    </BrowserSessionContext.Provider>
  );
}

export function useBrowserSession(): BrowserSessionSnapshot {
  const value = useContext(BrowserSessionContext);
  if (!value) {
    throw new Error("BrowserSessionProvider が必要です");
  }
  return value;
}

/** 共有セッションが揃い、トークンが無いときだけログインへ戻す。 */
export function useRedirectIfSignedOut(): void {
  const session = useBrowserSession();
  const router = useRouter();

  useEffect(() => {
    if (session.status !== "ready") return;
    if (session.accessToken) return;
    router.replace("/auth/login");
  }, [router, session.accessToken, session.status]);
}
