"use client";

import type { ReactNode } from "react";
import { ThemeContext, useThemeState } from "@/hooks/useTheme";

/** ルート用。テーマを html[data-theme] に適用し、設定画面と状態を共有する。 */
export function ThemeRoot({ children }: { children: ReactNode }) {
  const value = useThemeState();
  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}
