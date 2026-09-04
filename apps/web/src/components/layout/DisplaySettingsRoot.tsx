"use client";

import type { ReactNode } from "react";
import {
  DisplaySettingsContext,
  useDisplaySettingsState,
} from "@/hooks/useDisplaySettings";

/** ルート用。表示設定を html に適用し、設定画面と状態を共有する。 */
export function DisplaySettingsRoot({ children }: { children: ReactNode }) {
  const value = useDisplaySettingsState();
  return (
    <DisplaySettingsContext.Provider value={value}>
      {children}
    </DisplaySettingsContext.Provider>
  );
}
