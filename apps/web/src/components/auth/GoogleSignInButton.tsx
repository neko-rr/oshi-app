"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/client";
import { googleOAuthCallbackUrl } from "@/lib/authRedirect";
import { Button } from "@/components/ui/button";

type Props = {
  /** 交換後の着地。相対パスのみ。 */
  next?: string;
  className?: string;
};

/** Supabase Google OAuth（PKCE）。Client ID は Dashboard 側。 */
export function GoogleSignInButton({ next = "/", className }: Props) {
  const t = useTranslations("AuthOAuth");
  const locale = useLocale();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: googleOAuthCallbackUrl(
            window.location.origin,
            locale,
            next,
          ),
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : t("error"));
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={busy}
        onClick={() => void onClick()}
      >
        {busy ? t("continuing") : t("continueWithGoogle")}
      </Button>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
