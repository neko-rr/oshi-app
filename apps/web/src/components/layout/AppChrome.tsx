"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomTabBar from "@/components/layout/BottomTabBar";
import { FeedbackProvider } from "@/components/feedback/FeedbackProvider";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { GuestBanner } from "@/components/auth/GuestBanner";
import { useHasSession } from "@/hooks/useHasSession";
import { shouldHideBottomTabs } from "@/lib/appChromePolicy";

type AppChromeProps = {
  children: ReactNode;
};

/**
 * ロケール配下の共通シェル。幅と経路で Header / 下部タブを切替。
 */
export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const signedIn = useHasSession() === true;
  const hideTabs = shouldHideBottomTabs(pathname, signedIn);

  return (
    <FeedbackProvider>
      <Header compactNav={!hideTabs} signedIn={signedIn} />
      <GuestBanner />
      <OfflineBanner />
      <main
        className={[
          "mx-auto w-full max-w-3xl flex-1 px-4 py-density-main",
          hideTabs
            ? ""
            : "pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] lg:pb-density-main",
        ].join(" ")}
      >
        {children}
      </main>
      <Footer
        className={
          hideTabs
            ? undefined
            : "mb-[calc(3.5rem+env(safe-area-inset-bottom,0px))] lg:mb-0 max-lg:hidden"
        }
      />
      {hideTabs ? null : <BottomTabBar />}
    </FeedbackProvider>
  );
}
