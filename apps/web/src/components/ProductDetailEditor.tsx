"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_PATHS } from "@oshi/shared";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";

type ColorTagItem = {
  slot: number;
  color_tag_name: string;
  color_tag_color: string;
};

type CategoryTagItem = {
  category_tag_id: number;
  category_tag_name: string;
};

type StorageLocationItem = {
  storage_location_id: number;
  storage_location_name: string;
};

type ProductDetail = {
  registered_product_id: number;
  category_tag_id: number | null;
  storage_location_id: number | null;
  color_tag_slots: number[];
};

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

type Props = {
  registeredProductId: number;
};

export function ProductDetailEditor({ registeredProductId }: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryTagItem[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocationItem[]>([]);
  const [colors, setColors] = useState<ColorTagItem[]>([]);
  const [categoryTagId, setCategoryTagId] = useState<string>("");
  const [storageLocationId, setStorageLocationId] = useState<string>("");
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

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
        const headers = { Authorization: `Bearer ${token}` };
        const [catRes, recRes, colRes, detailRes] = await Promise.all([
          fetch(`${apiBase()}${API_PATHS.categoryTags}`, { headers }),
          fetch(`${apiBase()}${API_PATHS.storageLocations}`, { headers }),
          fetch(`${apiBase()}${API_PATHS.colorTags}`, { headers }),
          fetch(
            `${apiBase()}${API_PATHS.products}/${registeredProductId}`,
            { headers },
          ),
        ]);
        if (!catRes.ok || !recRes.ok || !colRes.ok || !detailRes.ok) {
          const bad = [catRes, recRes, colRes, detailRes].find((r) => !r.ok);
          throw new Error(
            `読み込み失敗: ${bad ? (await bad.text()).slice(0, 160) : ""}`,
          );
        }
        const catJson = (await catRes.json()) as { items?: CategoryTagItem[] };
        const recJson = (await recRes.json()) as {
          items?: StorageLocationItem[];
        };
        const colJson = (await colRes.json()) as { items?: ColorTagItem[] };
        const detail = (await detailRes.json()) as ProductDetail;
        if (cancelled) return;
        setCategories(catJson.items ?? []);
        setStorageLocations(recJson.items ?? []);
        setColors(colJson.items ?? []);
        setCategoryTagId(
          detail.category_tag_id != null ? String(detail.category_tag_id) : "",
        );
        setStorageLocationId(
          detail.storage_location_id != null
            ? String(detail.storage_location_id)
            : "",
        );
        setSelectedSlots(new Set(detail.color_tag_slots ?? []));
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
  }, [getToken, registeredProductId]);

  function toggleSlot(slot: number) {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const body: Record<string, unknown> = {
        color_tag_slots: Array.from(selectedSlots).sort((a, b) => a - b),
      };
      if (categoryTagId) {
        body.category_tag_id = Number(categoryTagId);
      } else {
        body.clear_category_tag = true;
      }
      if (storageLocationId) {
        body.storage_location_id = Number(storageLocationId);
      } else {
        body.clear_storage_location = true;
      }
      const res = await fetch(
        `${apiBase()}${API_PATHS.products}/${registeredProductId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        throw new Error(`更新失敗: ${(await res.text()).slice(0, 160)}`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("この製品を削除しますか？")) return;
    setDeleting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(
        `${apiBase()}${API_PATHS.products}/${registeredProductId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        throw new Error(`削除失敗: ${(await res.text()).slice(0, 160)}`);
      }
      router.push("/gallery");
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">編集フォーム読み込み中…</p>;
  }

  return (
    <form
      onSubmit={onSave}
      className="flex max-w-lg flex-col gap-4 rounded-md border border-border p-4"
    >
      <h2 className="text-lg font-medium">タグ・収納の編集</h2>

      <div className="grid gap-2">
        <Label htmlFor="category_tag_id">カテゴリータグ</Label>
        <select
          id="category_tag_id"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          value={categoryTagId}
          onChange={(e) => setCategoryTagId(e.target.value)}
        >
          <option value="">未設定</option>
          {categories.map((c) => (
            <option key={c.category_tag_id} value={c.category_tag_id}>
              {c.category_tag_name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="storage_location_id">収納場所</Label>
        <select
          id="storage_location_id"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs"
          value={storageLocationId}
          onChange={(e) => setStorageLocationId(e.target.value)}
        >
          <option value="">未設定</option>
          {storageLocations.map((r) => (
            <option key={r.storage_location_id} value={r.storage_location_id}>
              {r.storage_location_name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">カラータグ</legend>
        {colors.length === 0 ? (
          <p className="text-sm text-muted-foreground">カラータグ未設定</p>
        ) : (
          <div className="flex flex-col gap-2">
            {colors.map((c) => (
              <label
                key={c.slot}
                className="flex items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedSlots.has(c.slot)}
                  onChange={() => toggleSlot(c.slot)}
                />
                <span
                  className="inline-block h-3 w-3 rounded border border-border"
                  style={{ backgroundColor: c.color_tag_color }}
                  aria-hidden
                />
                {c.color_tag_name}（{c.slot}）
              </label>
            ))}
          </div>
        )}
      </fieldset>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || deleting}>
          {saving ? "保存中…" : "保存する"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={saving || deleting}
          onClick={() => void onDelete()}
        >
          {deleting ? "削除中…" : "製品を削除"}
        </Button>
      </div>
    </form>
  );
}
