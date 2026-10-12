"use client";

import { FormEvent, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API_PATHS } from "@oshi/shared";
import { createClient } from "@/lib/client";
import { NetworkRetryNotice } from "@/components/feedback/NetworkRetryNotice";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type OshiRow = {
  character_name: string;
  start_date: string | null;
  day_count: number | null;
  is_future: boolean;
};

function isRecord(raw: unknown): raw is Record<string, unknown> {
  return Boolean(raw) && typeof raw === "object";
}

function readRows(raw: unknown): OshiRow[] {
  if (!Array.isArray(raw)) return [];
  const rows: OshiRow[] = [];
  for (const item of raw) {
    if (!isRecord(item) || typeof item.character_name !== "string") continue;
    rows.push({
      character_name: item.character_name,
      start_date: typeof item.start_date === "string" ? item.start_date : null,
      day_count: typeof item.day_count === "number" ? item.day_count : null,
      is_future: item.is_future === true,
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
 * キャラごとの推し何日目。開始日を1日目として数える。
 */
export function OshiDayEditor({ raw }: { raw: unknown }) {
  const t = useTranslations("Dashboard");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const rows = readRows(raw);
  const [dates, setDates] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      rows.map((row) => [row.character_name, row.start_date ?? ""]),
    ),
  );
  const [addName, setAddName] = useState("");
  const [addDate, setAddDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function save(name: string, startDate: string) {
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
    if (!base) {
      setError(t("loadFailed"));
      return;
    }
    if (!name.trim() || !startDate) {
      setError(t("oshiDayInvalid"));
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
      const res = await fetch(`${base}${API_PATHS.oshiDays}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          character_name: name.trim(),
          start_date: startDate,
        }),
      });
      if (!res.ok) {
        setError(t("oshiDaySaveFailed"));
        return;
      }
      setAddName("");
      setAddDate("");
      router.refresh();
    } catch {
      setError(tCommon("offlineHint"));
    } finally {
      setSaving(false);
    }
  }

  async function remove(name: string) {
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
      const params = new URLSearchParams({ character_name: name });
      const res = await fetch(`${base}${API_PATHS.oshiDays}?${params}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setError(t("oshiDaySaveFailed"));
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
    void save(addName, addDate);
  }

  return (
    <section className="rounded-md border border-border bg-card p-4 text-card-foreground">
      <h2 className="text-lg font-medium tracking-tight">{t("oshiDayTitle")}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{t("oshiDayHint")}</p>
      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t("oshiDayEmpty")}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {rows.map((row, index) => (
            <li key={row.character_name} className="flex flex-col gap-2">
              <p className="text-sm font-medium">{row.character_name}</p>
              <p className="text-sm text-muted-foreground">
                {row.is_future
                  ? t("oshiDayFuture")
                  : row.day_count != null
                    ? t("oshiDayCount", { count: row.day_count })
                    : t("oshiDayUnset")}
              </p>
              <div className="flex flex-wrap items-end gap-2">
                <div className="grid gap-1">
                  <Label htmlFor={`oshi_day_${index}`}>
                    {t("oshiDayStart")}
                  </Label>
                  <Input
                    id={`oshi_day_${index}`}
                    type="date"
                    className="min-h-11"
                    value={dates[row.character_name] ?? ""}
                    onChange={(e) =>
                      setDates((prev) => ({
                        ...prev,
                        [row.character_name]: e.target.value,
                      }))
                    }
                  />
                </div>
                <Button
                  type="button"
                  className="min-h-11"
                  disabled={saving}
                  onClick={() =>
                    void save(
                      row.character_name,
                      dates[row.character_name] ?? "",
                    )
                  }
                >
                  {t("oshiDaySave")}
                </Button>
                {row.start_date ? (
                  <Button
                    type="button"
                    variant="outline"
                    className="min-h-11"
                    disabled={saving}
                    onClick={() => void remove(row.character_name)}
                  >
                    {t("oshiDayDelete")}
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={onAdd} className="mt-4 flex flex-col gap-2">
        <p className="text-sm font-medium">{t("oshiDayAdd")}</p>
        <div className="grid gap-1">
          <Label htmlFor="oshi_add_name">{t("oshiDayName")}</Label>
          <Input
            id="oshi_add_name"
            className="min-h-11"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div className="grid gap-1">
            <Label htmlFor="oshi_add_date">{t("oshiDayStart")}</Label>
            <Input
              id="oshi_add_date"
              type="date"
              className="min-h-11"
              value={addDate}
              onChange={(e) => setAddDate(e.target.value)}
            />
          </div>
          <Button type="submit" className="min-h-11" disabled={saving}>
            {t("oshiDaySave")}
          </Button>
        </div>
      </form>
      {error ? <NetworkRetryNotice message={error} /> : null}
    </section>
  );
}
