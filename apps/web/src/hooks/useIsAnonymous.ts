"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { isAnonymousUser } from "@/lib/authGuest";

/** セッションの is_anonymous を購読（ゲストバナー等用）。 */
export function useIsAnonymous(): boolean | null {
  const [value, setValue] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    async function refresh() {
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (!data.session?.user) {
        setValue(null);
        return;
      }
      setValue(isAnonymousUser(data.session.user));
    }

    void refresh();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  return value;
}
