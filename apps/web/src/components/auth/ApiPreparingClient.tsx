"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/i18n/navigation";
import { ApiWakeOverlay } from "@/components/auth/ApiWakeOverlay";
import { createClient } from "@/lib/client";
import { sanitizePreparingNext } from "@/lib/authRedirect";
import { waitForApiReady } from "@/lib/wakeApi";

type Props = {
  nextPath: string | null | undefined;
};

/**
 * OAuth callback 後の起床待ち。起きていればすぐ next へ進む。
 * セッション無しでは /health 連打しない（公開ページの悪用防止）。
 * 上限超過でも遷移する（従来の fail-open）。
 */
export function ApiPreparingClient({ nextPath }: Props) {
  const router = useRouter();
  const [active, setActive] = useState(true);
  const dest = sanitizePreparingNext(nextPath);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setActive(true);
      const supabase = createClient();
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) {
        await waitForApiReady();
        if (cancelled) return;
      }
      setActive(false);
      router.replace(dest);
      router.refresh();
    })();
    return () => {
      cancelled = true;
    };
  }, [dest, router]);

  return active ? <ApiWakeOverlay /> : null;
}
