"use client";

import type { ReactNode } from "react";
import { DisplaySettingsRoot } from "@/components/layout/DisplaySettingsRoot";
import { MascotRoot } from "@/components/layout/MascotRoot";
import { OshiAccentRoot } from "@/components/layout/OshiAccentRoot";
import { ThemeRoot } from "@/components/layout/ThemeRoot";

/** 見た目プリファレンス（テーマ・推し色・マスコット・文字・密度）を全ページで適用する。 */
export function AppPreferencesRoot({ children }: { children: ReactNode }) {
  return (
    <ThemeRoot>
      <OshiAccentRoot>
        <MascotRoot>
          <DisplaySettingsRoot>{children}</DisplaySettingsRoot>
        </MascotRoot>
      </OshiAccentRoot>
    </ThemeRoot>
  );
}
