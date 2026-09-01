"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/logout-button";
import { createClient } from "@/lib/client";

/**
 * ヘッダー用。ログイン状態に応じてログイン／ログアウトを出す。
 * JWT 本文は表示しない。
 */
export function HeaderAuthActions() {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        if (!cancelled) setSignedIn(Boolean(data.session));
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (signedIn === null) {
    return null;
  }

  if (!signedIn) {
    return (
      <Link href="/auth/login" className="hover:underline">
        ログイン
      </Link>
    );
  }

  return <LogoutButton variant="ghost" className="h-auto px-1 py-0 text-xs sm:text-sm" />;
}
