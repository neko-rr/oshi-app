"use client";

import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import { API_PATHS } from "@oshi/shared";
import { createClient } from "@/lib/client";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CONFIRMATION = "DELETE";

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000"
  );
}

export function DeleteAccountPanel() {
  const t = useTranslations("DeleteAccount");
  const router = useRouter();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);

  const canSubmit = typed === CONFIRMATION && !busy;

  const onSubmit = useCallback(async () => {
    if (typed !== CONFIRMATION) return;
    setBusy(true);
    setErrorText(null);
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session?.access_token) {
        setErrorText(t("errorUnauthorized"));
        return;
      }
      const res = await fetch(`${apiBase()}${API_PATHS.account}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ confirmation: CONFIRMATION }),
      });
      if (res.status === 503) {
        setErrorText(t("errorUnavailable"));
        return;
      }
      if (!res.ok) {
        setErrorText(t("errorGeneric"));
        return;
      }
      await supabase.auth.signOut();
      router.replace("/auth/login");
    } catch {
      setErrorText(t("errorGeneric"));
    } finally {
      setBusy(false);
    }
  }, [router, t, typed]);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-2 rounded-md border border-destructive/40 bg-card px-4 py-density text-card-foreground">
        <h2 className="text-base font-semibold text-destructive">
          {t("warningTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">{t("warningBody")}</p>
        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
          <li>{t("warningItemData")}</li>
          <li>{t("warningItemPhotos")}</li>
          <li>{t("warningItemAuth")}</li>
          <li>{t("warningItemImmediate")}</li>
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        {t.rich("exportHint", {
          link: (chunks) => (
            <Link
              href="/settings/export"
              className="text-primary underline-offset-4 hover:underline"
            >
              {chunks}
            </Link>
          ),
        })}
      </p>

      <div className="flex flex-col gap-2">
        <label htmlFor="delete-confirm" className="text-sm font-medium">
          {t("confirmLabel")}
        </label>
        <Input
          id="delete-confirm"
          autoComplete="off"
          spellCheck={false}
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          placeholder={CONFIRMATION}
          disabled={busy}
          aria-describedby="delete-confirm-hint"
        />
        <p id="delete-confirm-hint" className="text-xs text-muted-foreground">
          {t("confirmHint")}
        </p>
      </div>

      {errorText ? (
        <p className="text-sm text-destructive" role="alert">
          {errorText}
        </p>
      ) : null}

      <Button
        type="button"
        variant="destructive"
        disabled={!canSubmit}
        onClick={() => void onSubmit()}
      >
        {busy ? t("working") : t("submit")}
      </Button>
    </div>
  );
}
