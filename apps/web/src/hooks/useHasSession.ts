"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";

/** セッションの有無。読込中は null（ナビを出さない）。 */
export function useHasSession(): boolean | null {
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

  return signedIn;
}
