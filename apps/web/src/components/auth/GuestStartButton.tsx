"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/client";
import { wakeApiInBackground } from "@/lib/wakeApi";
import {
  authCaptchaBlockReason,
  readTurnstileSiteKey,
  resolveCaptchaToken,
} from "@/lib/authCaptcha";
import { AuthTurnstile } from "@/components/auth/AuthTurnstile";
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
  const tCaptcha = useTranslations("AuthCaptcha");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaRemount, setCaptchaRemount] = useState(0);

  function clearCaptcha() {
    setCaptchaToken(null);
    setCaptchaRemount((n) => n + 1);
  }

  async function onClick() {
    setBusy(true);
    setError(null);
    try {
      const siteKey = readTurnstileSiteKey(
        process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      );
      const block = authCaptchaBlockReason(siteKey, captchaToken);
      if (block === "missing_site_key") {
        setError(tCaptcha("missingSiteKey"));
        return;
      }
      if (block === "missing_token") {
        setError(tCaptcha("missingToken"));
        return;
      }
      const token = resolveCaptchaToken(captchaToken);
      if (!token) {
        setError(tCaptcha("missingToken"));
        return;
      }

      const supabase = createClient();
      const { error: signError } = await supabase.auth.signInAnonymously({
        options: { captchaToken: token },
      });
      if (signError) throw signError;
      clearCaptcha();
      wakeApiInBackground();
      router.push(redirectTo);
      router.refresh();
    } catch (err: unknown) {
      clearCaptcha();
      setError(err instanceof Error ? err.message : t("startError"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={className}>
      <AuthTurnstile
        action="guest"
        remountKey={captchaRemount}
        onTokenChange={setCaptchaToken}
        className="mb-3 flex justify-center"
      />
      <Button
        type="button"
        variant={variant}
        className="w-full"
        disabled={busy || !captchaToken}
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
