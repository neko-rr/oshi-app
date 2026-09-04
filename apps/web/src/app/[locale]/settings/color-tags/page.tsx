"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { API_PATHS } from "@oshi/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";

type ColorTagItem = {
  slot: number;
  color_tag_name: string;
  color_tag_color: string;
};

function emptySlots(): ColorTagItem[] {
  return Array.from({ length: 7 }, (_, i) => ({
    slot: i + 1,
    color_tag_name: "",
    color_tag_color: "#6c757d",
  }));
}

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

export default function ColorTagsSettingsPage() {
  const t = useTranslations("ColorTags");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const defaultSlots = useMemo(() => emptySlots(), []);
  const [entries, setEntries] = useState<ColorTagItem[]>(defaultSlots);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session) {
      router.push("/auth/login");
      return null;
    }
    return data.session.access_token;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const res = await fetch(`${apiBase()}${API_PATHS.colorTags}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          throw new Error(
            tCommon("fetchFailedPrefix", {
              detail: (await res.text()).slice(0, 160),
            }),
          );
        }
        const json = (await res.json()) as { items?: ColorTagItem[] };
        const bySlot = new Map(
          (json.items ?? []).map((item) => [item.slot, item]),
        );
        const next = defaultSlots.map((d) => {
          const found = bySlot.get(d.slot);
          return found
            ? {
                slot: d.slot,
                color_tag_name: found.color_tag_name ?? "",
                color_tag_color: found.color_tag_color ?? d.color_tag_color,
              }
            : d;
        });
        if (!cancelled) setEntries(next);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : tCommon("loadFailed"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, defaultSlots, tCommon]);

  function updateSlot(
    slot: number,
    patch: Partial<Pick<ColorTagItem, "color_tag_name" | "color_tag_color">>,
  ) {
    setEntries((prev) =>
      prev.map((e) => (e.slot === slot ? { ...e, ...patch } : e)),
    );
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${apiBase()}${API_PATHS.colorTags}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entries: entries.map((item) => ({
            slot: item.slot,
            color_tag_name:
              item.color_tag_name.trim() ||
              t("defaultName", { slot: item.slot }),
            color_tag_color: item.color_tag_color,
          })),
        }),
      });
      if (!res.ok) {
        throw new Error(
          tCommon("saveFailedPrefix", {
            detail: (await res.text()).slice(0, 160),
          }),
        );
      }
      const json = (await res.json()) as { items?: ColorTagItem[] };
      if (json.items?.length) {
        const bySlot = new Map(json.items.map((item) => [item.slot, item]));
        setEntries(
          defaultSlots.map((d) => {
            const found = bySlot.get(d.slot);
            return found
              ? {
                  slot: d.slot,
                  color_tag_name: found.color_tag_name ?? "",
                  color_tag_color: found.color_tag_color ?? d.color_tag_color,
                }
              : d;
          }),
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("saveFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="stack-density-lg">
      <div>
        <Link
          href="/settings"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          {tCommon("backToSettings")}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      ) : (
        <form onSubmit={onSave} className="flex max-w-lg flex-col gap-4">
          {entries.map((item) => (
            <div
              key={item.slot}
              className="grid gap-2 rounded-md border border-border p-3"
            >
              <p className="text-sm font-medium">
                {t("slotLabel", { slot: item.slot })}
              </p>
              <div className="grid gap-2">
                <Label htmlFor={`color-name-${item.slot}`}>{tCommon("name")}</Label>
                <Input
                  id={`color-name-${item.slot}`}
                  value={item.color_tag_name}
                  placeholder={t("defaultName", { slot: item.slot })}
                  onChange={(e) =>
                    updateSlot(item.slot, { color_tag_name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`color-hex-${item.slot}`}>{tCommon("color")}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id={`color-hex-${item.slot}`}
                    type="color"
                    className="h-10 w-14 p-1"
                    value={
                      /^#[0-9A-Fa-f]{6}$/.test(item.color_tag_color)
                        ? item.color_tag_color
                        : "#6c757d"
                    }
                    onChange={(e) =>
                      updateSlot(item.slot, { color_tag_color: e.target.value })
                    }
                  />
                  <Input
                    value={item.color_tag_color}
                    onChange={(e) =>
                      updateSlot(item.slot, { color_tag_color: e.target.value })
                    }
                    placeholder={t("hexPlaceholder")}
                  />
                </div>
              </div>
            </div>
          ))}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={saving}>
            {saving ? tCommon("saving") : tCommon("saveAction")}
          </Button>
        </form>
      )}
    </div>
  );
}
