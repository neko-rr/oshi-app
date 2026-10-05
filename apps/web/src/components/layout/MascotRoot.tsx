"use client";

import type { ReactNode } from "react";
import { MascotContext, useMascotState } from "@/hooks/useMascot";

/** ルート用。mascot_id を html[data-mascot] に載せ、設定と共有する。 */
export function MascotRoot({ children }: { children: ReactNode }) {
  const value = useMascotState();
  return (
    <MascotContext.Provider value={value}>{children}</MascotContext.Provider>
  );
}
