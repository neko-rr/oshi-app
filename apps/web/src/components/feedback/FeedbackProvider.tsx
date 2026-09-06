"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type FlashKind = "success" | "error";

type FlashState = {
  id: number;
  kind: FlashKind;
  message: string;
};

type FeedbackApi = {
  flashSuccess: (message: string) => void;
  flashError: (message: string) => void;
};

const FeedbackContext = createContext<FeedbackApi | null>(null);

const FLASH_MS = 2200;

/**
 * 短い成功／失敗トースト。依存ライブラリなし。
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [flash, setFlash] = useState<FlashState | null>(null);

  const flashSuccess = useCallback((message: string) => {
    setFlash({ id: Date.now(), kind: "success", message });
  }, []);

  const flashError = useCallback((message: string) => {
    setFlash({ id: Date.now(), kind: "error", message });
  }, []);

  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(null), FLASH_MS);
    return () => window.clearTimeout(timer);
  }, [flash]);

  const api = useMemo(
    () => ({ flashSuccess, flashError }),
    [flashSuccess, flashError],
  );

  return (
    <FeedbackContext.Provider value={api}>
      {children}
      {flash ? (
        <div
          key={flash.id}
          role="status"
          aria-live="polite"
          className={[
            "pointer-events-none fixed inset-x-0 top-[max(0.75rem,env(safe-area-inset-top))] z-[70] flex justify-center px-3",
          ].join(" ")}
        >
          <p
            className={[
              "max-w-sm rounded-full px-4 py-2 text-center text-sm font-medium shadow-md",
              flash.kind === "success"
                ? "bg-primary text-primary-foreground"
                : "bg-destructive text-destructive-foreground",
            ].join(" ")}
          >
            {flash.message}
          </p>
        </div>
      ) : null}
    </FeedbackContext.Provider>
  );
}

export function useFeedback(): FeedbackApi {
  const ctx = useContext(FeedbackContext);
  if (!ctx) {
    return {
      flashSuccess: () => undefined,
      flashError: () => undefined,
    };
  }
  return ctx;
}
