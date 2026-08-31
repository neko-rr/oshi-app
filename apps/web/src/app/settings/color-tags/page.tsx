"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
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

const DEFAULT_SLOTS: ColorTagItem[] = Array.from({ length: 7 }, (_, i) => ({
  slot: i + 1,
  color_tag_name: `色${i + 1}`,
  color_tag_color: "#6c757d",
}));

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

export default function ColorTagsSettingsPage() {
  const router = useRouter();
  const [entries, setEntries] = useState<ColorTagItem[]>(DEFAULT_SLOTS);
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
          throw new Error(`取得失敗: ${(await res.text()).slice(0, 160)}`);
        }
        const json = (await res.json()) as { items?: ColorTagItem[] };
        const bySlot = new Map(
          (json.items ?? []).map((item) => [item.slot, item]),
        );
        const next = DEFAULT_SLOTS.map((d) => {
          const found = bySlot.get(d.slot);
          return found
            ? {
                slot: d.slot,
                color_tag_name: found.color_tag_name ?? d.color_tag_name,
                color_tag_color: found.color_tag_color ?? d.color_tag_color,
              }
            : d;
        });
        if (!cancelled) setEntries(next);
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "読み込みに失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken]);

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
            color_tag_name: item.color_tag_name,
            color_tag_color: item.color_tag_color,
          })),
        }),
      });
      if (!res.ok) {
        throw new Error(`保存失敗: ${(await res.text()).slice(0, 160)}`);
      }
      const json = (await res.json()) as { items?: ColorTagItem[] };
      if (json.items?.length) {
        const bySlot = new Map(json.items.map((item) => [item.slot, item]));
        setEntries(
          DEFAULT_SLOTS.map((d) => {
            const found = bySlot.get(d.slot);
            return found
              ? {
                  slot: d.slot,
                  color_tag_name: found.color_tag_name ?? d.color_tag_name,
                  color_tag_color: found.color_tag_color ?? d.color_tag_color,
                }
              : d;
          }),
        );
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <div>
        <Link
          href="/settings"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          ← 設定
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          カラータグ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          スロット 1〜7 の名前と色を編集
        </p>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中…</p>
      ) : (
        <form onSubmit={onSave} className="flex max-w-lg flex-col gap-4">
          {entries.map((item) => (
            <div
              key={item.slot}
              className="grid gap-2 rounded-md border border-border p-3"
            >
              <p className="text-sm font-medium">スロット {item.slot}</p>
              <div className="grid gap-2">
                <Label htmlFor={`color-name-${item.slot}`}>名前</Label>
                <Input
                  id={`color-name-${item.slot}`}
                  value={item.color_tag_name}
                  onChange={(e) =>
                    updateSlot(item.slot, { color_tag_name: e.target.value })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor={`color-hex-${item.slot}`}>色</Label>
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
                    placeholder="#rrggbb"
                  />
                </div>
              </div>
            </div>
          ))}

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <Button type="submit" disabled={saving}>
            {saving ? "保存中…" : "保存する"}
          </Button>
        </form>
      )}
    </div>
  );
}
