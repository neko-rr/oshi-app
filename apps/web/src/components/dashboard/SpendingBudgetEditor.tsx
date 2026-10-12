"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { API_PATHS } from "@oshi/shared";
import { createClient } from "@/lib/client";
import { FormattedAppMoney } from "@/components/format/FormattedAppMoney";
import { galleryListHref } from "@/lib/galleryListQuery";
import { NetworkRetryNotice } from "@/components/feedback/NetworkRetryNotice";
import { CurrencyCodePicker } from "@/components/settings/CurrencyCodePicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type BudgetRow = {
  currency_code: string;
  monthly_amount: number | null;
  spent: number;
  remaining: number | null;
};

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === "object";
}

function readBudgets(raw: unknown): BudgetRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: BudgetRow[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.currency_code !== "string") continue;
    const amount = item.monthly_amount;
    const remaining = item.remaining;
    rows.push({
      currency_code: item.currency_code,
      monthly_amount: typeof amount === "number" ? amount : null,
      spent: typeof item.spent === "number" ? item.spent : 0,
      remaining: typeof remaining === "number" ? remaining : null,
    });
  }
  return rows;
}

async function bearerToken(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.access_token;
}

/**
 * 今月の支出と、通貨ごとの毎月の上限。
 */
export function SpendingBudgetEditor({
  raw,
  currentMonth,
}: {
  raw: unknown;
  currentMonth: string | null;
}) {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const rows = readBudgets(raw);
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rows.map((row) => [
        row.currency_code,
        row.monthly_amount == null ? "" : String(row.monthly_amount),
      ]),
    ),
  );
  const [addCode, setAddCode] = useState("JPY");
  const [addAmount, setAddAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(code: string, amountText: string) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
    if (!base) {
      setError(t("loadFailed"));
      return;
    }
    const amount = Number(amountText.trim());
    if (!Number.isInteger(amount) || amount < 0) {
      setError(t("budgetInvalid"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await bearerToken();
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const res = await fetch(`${base}${API_PATHS.spendingBudgets}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currency_code: code, monthly_amount: amount }),
      });
      if (!res.ok) {
        setError(t("budgetSaveFailed"));
        return;
      }
      router.refresh();
    } catch {
      setError(tCommon("offlineHint"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(code: string) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
    if (!base) return;
    setSaving(true);
    setError(null);
    try {
      const token = await bearerToken();
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const res = await fetch(
        `${base}${API_PATHS.spendingBudgets}/${encodeURIComponent(code)}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!res.ok) {
        setError(t("budgetSaveFailed"));
        return;
      }
      router.refresh();
    } catch {
      setError(tCommon("offlineHint"));
    } finally {
      setSaving(false);
    }
  }

  function onAdd(e: FormEvent) {
    e.preventDefault();
    void save(addCode, addAmount);
  }

  return (
    <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
      <h2 className="text-lg font-medium tracking-tight">{t("budgetTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("budgetHint")}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("budgetEmpty")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {rows.map((row) => (
            <li key={row.currency_code} className="flex flex-col gap-2">
              <p className="text-sm">
                <span className="font-medium">{row.currency_code}</span>
                <span className="text-muted-foreground">
                  {" "}
                  {currentMonth ? (
                    <Link
                      href={galleryListHref({ purchase_month: currentMonth })}
                      className="underline-offset-4 hover:underline"
                    >
                      {t("budgetSpent")}
                    </Link>
                  ) : (
                    t("budgetSpent")
                  )}{" "}
                </span>
                <FormattedAppMoney
                  value={row.spent}
                  currencyCode={row.currency_code}
                />
                {row.remaining != null ? (
                  <span className="text-muted-foreground">
                    {" "}
                    · {row.remaining < 0 ? t("budgetOver") : t("budgetLeft")}{" "}
                    <FormattedAppMoney
                      value={Math.abs(row.remaining)}
                      currencyCode={row.currency_code}
                    />
                  </span>
                ) : null}
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="grid gap-1">
                  <Label htmlFor={`budget_${row.currency_code}`}>
                    {t("budgetAmount")}
                  </Label>
                  <Input
                    id={`budget_${row.currency_code}`}
                    inputMode="numeric"
                    className="min-h-11 w-36"
                    value={amounts[row.currency_code] ?? ""}
                    onChange={(e) =>
                      setAmounts((prev) => ({
                        ...prev,
                        [row.currency_code]: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={saving}
                  onClick={() =>
                    void save(row.currency_code, amounts[row.currency_code] ?? "")
                  }
                >
                  {t("budgetSave")}
                </Button>
                {row.monthly_amount != null ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={saving}
                    onClick={() => void remove(row.currency_code)}
                  >
                    {t("budgetDelete")}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onAdd} className="mt-4 flex flex-col gap-2">
        <p className="text-sm font-medium">{t("budgetAdd")}</p>
        <CurrencyCodePicker
          id="budget_add_currency"
          value={addCode}
          onChange={setAddCode}
        />
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1">
            <Label htmlFor="budget_add_amount">{t("budgetAmount")}</Label>
            <Input
              id="budget_add_amount"
              inputMode="numeric"
              className="min-h-11 w-36"
              value={addAmount}
              onChange={(e) => setAddAmount(e.target.value)}
            />
          </div>
          <Button type="submit" className="min-h-11" disabled={saving}>
            {t("budgetSave")}
          </Button>
        </div>
      </form>
      {error ? <NetworkRetryNotice message={error} /> : null}
    </section>
  );
}
