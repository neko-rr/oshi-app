"use client";

import type { ReactNode } from "react";
import {
  OshiAccentContext,
  useOshiAccentState,
} from "@/hooks/useOshiAccent";

/** ルート用。推し色の適用／プレビューを html に注入する。 */
export function OshiAccentRoot({ children }: { children: ReactNode }) {
  const value = useOshiAccentState();
  return (
    <OshiAccentContext.Provider value={value}>
      {children}
    </OshiAccentContext.Provider>
  );
}
