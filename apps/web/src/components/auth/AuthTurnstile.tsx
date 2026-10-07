"use client";

import { useMemo } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { useTranslations } from "next-intl";
import {
  isTurnstileConfigured,
  readTurnstileSiteKey,
} from "@/lib/authCaptcha";

type Props = {
  /** Turnstile data-action（ゲスト / ログイン等） */
  action: string;
  /** 取得トークン。期限切れ・失敗時は null */
  onTokenChange: (token: string | null) => void;
  /** 失敗後にウィジェットを張り直すときのキー */
  remountKey?: number;
  className?: string;
};

/**
 * Supabase Auth CAPTCHA 用 Turnstile。
 * Secret はフロントに置かず、検証は Supabase が行う。
 */
export function AuthTurnstile({
  action,
  onTokenChange,
  remountKey = 0,
  className,
}: Props) {
  const t = useTranslations("AuthCaptcha");
  const siteKey = useMemo(
    () => readTurnstileSiteKey(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY),
    [],
  );

  if (!isTurnstileConfigured(siteKey)) {
    return (
      <p className="text-sm text-destructive" role="alert">
        {t("missingSiteKey")}
      </p>
    );
  }

  return (
    <div className={className}>
      <Turnstile
        key={`${action}-${remountKey}`}
        siteKey={siteKey}
        options={{ action, theme: "auto", size: "flexible" }}
        onSuccess={(token) => onTokenChange(token)}
        onExpire={() => onTokenChange(null)}
        onError={() => onTokenChange(null)}
      />
    </div>
  );
}
