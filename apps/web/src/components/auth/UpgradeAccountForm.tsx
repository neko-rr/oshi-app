"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/client";
import { isAnonymousUser } from "@/lib/authGuest";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * ゲスト → 本登録（同一 user にメール紐づけ）。
 * 公式: updateUser({ email }) → 確認 → updateUser({ password })
 */
export function UpgradeAccountForm() {
  const t = useTranslations("GuestUpgrade");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [phase, setPhase] = useState<"email" | "await_verify" | "password">(
    "email",
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const { data, error: sessErr } = await supabase.auth.getSession();
      if (cancelled) return;
      if (sessErr || !data.session) {
        router.replace("/auth/login");
        return;
      }
      if (!isAnonymousUser(data.session.user)) {
        router.replace("/");
        return;
      }
      // メール確認済みでまだパスワード未設定の途中復帰
      const u = data.session.user;
      if (u.email && u.email_confirmed_at) {
        setPhase("password");
        setEmail(u.email);
      } else if (u.email) {
        setPhase("await_verify");
        setEmail(u.email);
      }
      setReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function submitEmail(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { error: updErr } = await supabase.auth.updateUser({ email });
      if (updErr) {
        if (/already|registered|exists/i.test(updErr.message)) {
          setError(t("emailTaken"));
        } else {
          setError(updErr.message);
        }
        return;
      }
      setPhase("await_verify");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("genericError"));
    } finally {
      setBusy(false);
    }
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (password !== repeatPassword) {
      setError(t("passwordMismatch"));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user?.email_confirmed_at && isAnonymousUser(data.user)) {
        setError(t("verifyFirst"));
        setPhase("await_verify");
        return;
      }
      const { error: pwdErr } = await supabase.auth.updateUser({ password });
      if (pwdErr) throw pwdErr;
      router.replace("/");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("genericError"));
    } finally {
      setBusy(false);
    }
  }

  if (!ready) {
    return (
      <p className="py-6 text-sm text-muted-foreground">{t("loading")}</p>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("description")}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {phase === "email" ? (
          <form onSubmit={(e) => void submitEmail(e)} className="flex flex-col gap-4">
            <div className="grid gap-2">
              <Label htmlFor="upgrade-email">{t("email")}</Label>
              <Input
                id="upgrade-email"
                type="email"
                required
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                autoComplete="email"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            {error === t("emailTaken") ? (
              <p className="text-sm text-muted-foreground">
                <Link
                  href="/auth/login"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {t("goLogin")}
                </Link>
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              {busy ? t("sending") : t("sendVerify")}
            </Button>
          </form>
        ) : null}

        {phase === "await_verify" ? (
          <div className="flex flex-col gap-3 text-sm">
            <p>{t("checkEmail", { email })}</p>
            <p className="text-muted-foreground">{t("checkEmailHint")}</p>
            {error ? (
              <p className="text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setPhase("password");
                setError(null);
              }}
            >
              {t("verifiedContinue")}
            </Button>
          </div>
        ) : null}

        {phase === "password" ? (
          <form
            onSubmit={(e) => void submitPassword(e)}
            className="flex flex-col gap-4"
          >
            <div className="grid gap-2">
              <Label htmlFor="upgrade-password">{t("password")}</Label>
              <Input
                id="upgrade-password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(ev) => setPassword(ev.target.value)}
                autoComplete="new-password"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="upgrade-password2">{t("passwordRepeat")}</Label>
              <Input
                id="upgrade-password2"
                type="password"
                required
                minLength={8}
                value={repeatPassword}
                onChange={(ev) => setRepeatPassword(ev.target.value)}
                autoComplete="new-password"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <Button type="submit" disabled={busy}>
              {busy ? t("saving") : t("setPassword")}
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
