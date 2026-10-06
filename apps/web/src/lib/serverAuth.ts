/**
 * サーバー Component / Route 用。認可は getUser、Bearer は getSession の token のみ。
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

export type ServerAuthUser = {
  id: string;
  email?: string | null;
  is_anonymous?: boolean | null;
};

export type ServerAuth = {
  user: ServerAuthUser;
  accessToken: string;
};

/** getUser の結果を正とし、session.user は使わない。 */
export function pickServerAuth(
  user: ServerAuthUser | null | undefined,
  session: { access_token?: string | null; user?: unknown } | null | undefined,
): ServerAuth | null {
  if (!user?.id) return null;
  const accessToken = session?.access_token?.trim() ?? "";
  if (!accessToken) return null;
  return {
    user: {
      id: user.id,
      email: user.email ?? null,
      is_anonymous: user.is_anonymous ?? null,
    },
    accessToken,
  };
}

type AuthClient = {
  auth: {
    getUser: () => Promise<{
      data: { user: ServerAuthUser | null };
      error: { message: string } | null;
    }>;
    getSession: () => Promise<{
      data: {
        session: {
          access_token?: string | null;
          user?: unknown;
        } | null;
      };
      error: { message: string } | null;
    }>;
  };
};

/** Auth サーバーで user を確認し、Bearer 用 token だけ session から取る。 */
export async function loadServerAuth(
  supabase: AuthClient,
): Promise<ServerAuth | null> {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return null;
  const { data: sessionData } = await supabase.auth.getSession();
  return pickServerAuth(userData.user, sessionData.session);
}
