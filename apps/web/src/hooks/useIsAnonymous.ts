"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/client";
import { isAnonymousUser } from "@/lib/authGuest";
import { getClientE2eStubSession } from "@/lib/e2eAuthStub";
import { runAfterTick } from "@/lib/runAfterTick";

/** セッションの is_anonymous を購読（ゲストバナー等用）。 */
export function useIsAnonymous(): boolean | null {
  const [value, setValue] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    let unsubscribe: (() => void) | undefined;
    const cancelTick = runAfterTick(() => {
      const stub = getClientE2eStubSession();
      if (stub) {
        setValue(stub.isAnonymous);
        return;
      }
      const supabase = createClient();

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
      unsubscribe = () => sub.subscription.unsubscribe();
    });
    return () => {
      cancelled = true;
      cancelTick();
      unsubscribe?.();
    };
  }, []);

  return value;
}
