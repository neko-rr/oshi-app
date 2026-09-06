"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

/**
 * オフライン時の薄い常時案内（接続復帰で消える）。
 */
export function OfflineBanner() {
  const t = useTranslations("Common");
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const sync = () => setOffline(!navigator.onLine);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="border-b border-amber-500/40 bg-amber-500/15 px-3 py-2 text-center text-sm text-foreground"
      role="status"
    >
      {t("offlineBanner")}
    </div>
  );
}
