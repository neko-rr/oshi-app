/**
 * Google OAuth 開始（ログイン用 signIn / ゲスト本登録用 linkIdentity）。
 * ゲストの UID を維持するため、本登録では必ず linkIdentity を使う。
 */

export type GoogleAuthMode = "signIn" | "linkIdentity";

export type GoogleAuthClient = {
  auth: {
    signInWithOAuth: (args: {
      provider: "google";
      options: { redirectTo: string };
    }) => Promise<{ error: { message: string } | null }>;
    linkIdentity: (args: {
      provider: "google";
      options: { redirectTo: string };
    }) => Promise<{ error: { message: string } | null }>;
  };
};

/** ゲスト本登録は linkIdentity。通常ログイン／新規は signIn。 */
export function resolveGoogleAuthMode(intent: "login" | "upgrade"): GoogleAuthMode {
  return intent === "upgrade" ? "linkIdentity" : "signIn";
}

export async function startGoogleAuth(
  client: GoogleAuthClient,
  args: { mode: GoogleAuthMode; redirectTo: string },
): Promise<{ error: { message: string } | null }> {
  if (
    !args.redirectTo.startsWith("http://") &&
    !args.redirectTo.startsWith("https://")
  ) {
    return { error: { message: "invalid_redirect" } };
  }
  if (args.mode === "linkIdentity") {
    return client.auth.linkIdentity({
      provider: "google",
      options: { redirectTo: args.redirectTo },
    });
  }
  return client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: args.redirectTo },
  });
}
