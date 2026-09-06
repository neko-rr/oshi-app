"use client";

import type { ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import BottomTabBar from "@/components/layout/BottomTabBar";
import { FeedbackProvider } from "@/components/feedback/FeedbackProvider";
import { OfflineBanner } from "@/components/feedback/OfflineBanner";
import { GuestBanner } from "@/components/auth/GuestBanner";

type AppChromeProps = {
  children: ReactNode;
};

/** 認証・開発 Lab では下部タブを出さない */
function shouldHideBottomTabs(pathname: string): boolean {
  return (
    pathname.startsWith("/auth") ||
    pathname.startsWith("/dev") ||
    pathname === "/auth"
  );
}

/**
 * ロケール配下の共通シェル。幅と経路で Header / 下部タブを切替。
 */
export default function AppChrome({ children }: AppChromeProps) {
  const pathname = usePathname();
  const hideTabs = shouldHideBottomTabs(pathname);

  return (
    <FeedbackProvider>
      <Header compactNav={!hideTabs} />
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
