/** E2E 専用の認証テストダブル。本番（CF）ではフラグを置かない。 */

export const E2E_AUTH_COOKIE = "oshi_e2e_auth";
export const E2E_STUB_ACCESS_TOKEN = "e2e-stub-token";

export type E2eAuthRole = "guest" | "permanent";

export type E2eStubSession = {
  accessToken: string;
  isAnonymous: boolean;
};

export function parseE2eAuthRole(
  raw: string | undefined | null,
): E2eAuthRole | null {
  if (raw === "guest" || raw === "permanent") return raw;
  return null;
}

/** クライアントバンドルに焼き込む公開フラグ。CF には置かない。 */
export function isE2eAuthStubBuildEnabled(): boolean {
  return process.env.NEXT_PUBLIC_E2E_AUTH_STUB_ENABLED === "1";
}

/** middleware 用。Edge でも見えるよう公開フラグも見る。CF には置かない。 */
export function isE2eAuthStubServerEnabled(): boolean {
  return (
    process.env.E2E_AUTH_STUB_ENABLED === "1" ||
    process.env.NEXT_PUBLIC_E2E_AUTH_STUB_ENABLED === "1"
  );
}

export function stubSessionFromRole(role: E2eAuthRole): E2eStubSession {
  return {
    accessToken: E2E_STUB_ACCESS_TOKEN,
    isAnonymous: role === "guest",
  };
}

export function readE2eAuthCookieFromHeader(
  cookieHeader: string | undefined | null,
): E2eAuthRole | null {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";");
  for (const part of parts) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const name = trimmed.slice(0, eq).trim();
    if (name !== E2E_AUTH_COOKIE) continue;
    return parseE2eAuthRole(decodeURIComponent(trimmed.slice(eq + 1).trim()));
  }
  return null;
}

/** クライアント: ビルドフラグ ON かつ Cookie があるときだけ stub。 */
export function getClientE2eStubSession(): E2eStubSession | null {
  if (!isE2eAuthStubBuildEnabled()) return null;
  if (typeof document === "undefined") return null;
  const role = readE2eAuthCookieFromHeader(document.cookie);
  if (!role) return null;
  return stubSessionFromRole(role);
}
