"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { API_PATHS } from "@oshi/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";

type StorageLocationItem = {
  storage_location_id: number;
  storage_location_name: string;
  storage_location_icon?: string;
};

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

export default function ReceiptLocationsSettingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<StorageLocationItem[]>([]);
  const [name, setName] = useState("");
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

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${apiBase()}${API_PATHS.storageLocations}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`取得失敗: ${(await res.text()).slice(0, 160)}`);
      }
      const json = (await res.json()) as { items?: StorageLocationItem[] };
      setItems(json.items ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    void load();
  }, [load]);

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${apiBase()}${API_PATHS.storageLocations}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          storage_location_name: name.trim(),
        }),
      });
      if (!res.ok) {
        throw new Error(`追加失敗: ${(await res.text()).slice(0, 160)}`);
      }
      setName("");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(
        `${apiBase()}${API_PATHS.storageLocations}/${id}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        throw new Error(`削除失敗: ${(await res.text()).slice(0, 160)}`);
      }
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
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
          収納場所
        </h1>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">読み込み中…</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.length === 0 ? (
            <li className="text-sm text-muted-foreground">まだありません</li>
          ) : (
            items.map((item) => (
              <li
                key={item.storage_location_id}
                className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2"
              >
                <span className="text-sm">{item.storage_location_name}</span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={() => void onDelete(item.storage_location_id)}
                >
                  削除
                </Button>
              </li>
            ))
          )}
        </ul>
      )}

      <form onSubmit={onCreate} className="flex max-w-md flex-col gap-3">
        <div className="grid gap-2">
          <Label htmlFor="storage_location_name">新しい収納場所名</Label>
          <Input
            id="storage_location_name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? "追加中…" : "追加する"}
        </Button>
      </form>
    </div>
  );
}
