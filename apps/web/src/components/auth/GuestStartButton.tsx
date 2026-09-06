"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/client";
import { Button } from "@/components/ui/button";

type Props = {
  /** 開始後の遷移先 */
  redirectTo?: string;
  variant?: "default" | "secondary" | "outline";
  className?: string;
};

/** Anonymous Sign-In でゲスト開始するボタン。 */
export function GuestStartButton({
  redirectTo = "/",
  variant = "secondary",
  className,
}: Props) {
  const t = useTranslations("Guest");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInAnonymously();
      if (signError) throw signError;
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("startError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant={variant}
        disabled={busy}
        onClick={() => void onClick()}
      >
        {busy ? t("starting") : t("startAsGuest")}
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
