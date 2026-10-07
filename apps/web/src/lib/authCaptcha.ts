/**
 * Supabase Auth CAPTCHA（Turnstile）用の純関数。
 * Secret は扱わない（検証は Supabase Dashboard 側）。
 */

export type AuthCaptchaBlockReason = "missing_site_key" | "missing_token";

/** env の Site Key を正規化する。 */
export function readTurnstileSiteKey(
  envValue: string | null | undefined,
): string {
  return (envValue ?? "").trim();
}

export function isTurnstileConfigured(siteKey: string): boolean {
  return siteKey.length > 0;
}

/** 取得済みトークンを正規化する。空なら null。 */
export function resolveCaptchaToken(
  token: string | null | undefined,
): string | null {
  const trimmed = (token ?? "").trim();
  return trimmed.length > 0 ? trimmed : null;
}

/**
 * Auth 呼び出し前のゲート。
 * Site Key 未設定、またはトークン未取得なら理由を返す。
 */
export function authCaptchaBlockReason(
  siteKey: string,
  token: string | null | undefined,
): AuthCaptchaBlockReason | null {
  const key = readTurnstileSiteKey(siteKey);
  if (!isTurnstileConfigured(key)) {
    return "missing_site_key";
  }
  if (!resolveCaptchaToken(token)) {
    return "missing_token";
  }
  return null;
}
