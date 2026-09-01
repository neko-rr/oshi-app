"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  API_PATHS,
  LUCIDE_CATEGORY_PICKER,
  LUCIDE_ICON_FALLBACK_CATEGORY,
} from "@oshi/shared";
import IconPickerGrid from "@/components/settings/IconPickerGrid";
import { LucideIconBySlug } from "@/components/ui/LucideIconBySlug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";

type CategoryTagItem = {
  category_tag_id: number;
  category_tag_name: string;
  category_tag_color: string;
  category_tag_icon?: string;
};

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

export default function CategoryTagsSettingsPage() {
  const router = useRouter();
  const [items, setItems] = useState<CategoryTagItem[]>([]);
  const [name, setName] = useState("");
  const [color, setColor] = useState("#6c757d");
  const [createIcon, setCreateIcon] = useState<string>(
    LUCIDE_ICON_FALLBACK_CATEGORY,
  );
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6c757d");
  const [editIcon, setEditIcon] = useState<string>(LUCIDE_ICON_FALLBACK_CATEGORY);
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
      const res = await fetch(`${apiBase()}${API_PATHS.categoryTags}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`取得失敗: ${(await res.text()).slice(0, 160)}`);
      }
      const json = (await res.json()) as { items?: CategoryTagItem[] };
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

  function startEdit(item: CategoryTagItem) {
    setEditingId(item.category_tag_id);
    setEditName(item.category_tag_name);
    setEditColor(
      /^#[0-9A-Fa-f]{6}$/.test(item.category_tag_color)
        ? item.category_tag_color
        : "#6c757d",
    );
    setEditIcon(item.category_tag_icon || LUCIDE_ICON_FALLBACK_CATEGORY);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${apiBase()}${API_PATHS.categoryTags}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          category_tag_name: name.trim(),
          category_tag_color: color || "#6c757d",
          category_tag_icon: createIcon,
        }),
      });
      if (!res.ok) {
        throw new Error(`追加失敗: ${(await res.text()).slice(0, 160)}`);
      }
      setName("");
      setCreateIcon(LUCIDE_ICON_FALLBACK_CATEGORY);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "追加に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (editingId == null || !editName.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(
        `${apiBase()}${API_PATHS.categoryTags}/${editingId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            category_tag_name: editName.trim(),
            category_tag_color: editColor || "#6c757d",
            category_tag_icon: editIcon,
          }),
        },
      );
      if (!res.ok) {
        throw new Error(`更新失敗: ${(await res.text()).slice(0, 160)}`);
      }
      setEditingId(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete(id: number) {
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(`${apiBase()}${API_PATHS.categoryTags}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error(`削除失敗: ${(await res.text()).slice(0, 160)}`);
      }
      if (editingId === id) setEditingId(null);
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
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          ← 設定
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
          カテゴリータグ
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          グッズの種類に合う Lucide アイコンを選べます（LOFT 系・お洒落可愛い）。
        </p>
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
                key={item.category_tag_id}
                className="rounded-2xl border border-border bg-card px-3 py-2"
              >
                {editingId === item.category_tag_id ? (
                  <form onSubmit={onSaveEdit} className="flex flex-col gap-3">
                    <div className="grid min-w-[10rem] gap-1">
                      <Label htmlFor={`edit-name-${item.category_tag_id}`}>
                        名前
                      </Label>
                      <Input
                        id={`edit-name-${item.category_tag_id}`}
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`edit-color-${item.category_tag_id}`}>
                        色
                      </Label>
                      <Input
                        id={`edit-color-${item.category_tag_id}`}
                        type="color"
                        className="h-10 w-14 p-1"
                        value={
                          /^#[0-9A-Fa-f]{6}$/.test(editColor)
                            ? editColor
                            : "#6c757d"
                        }
                        onChange={(e) => setEditColor(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label>アイコン</Label>
                      <IconPickerGrid
                        options={LUCIDE_CATEGORY_PICKER}
                        value={editIcon}
                        onChange={setEditIcon}
                        ariaLabel="カテゴリタグのアイコン"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? "保存中…" : "保存"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                      >
                        キャンセル
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-sm">
                      <span
                        className="flex size-8 items-center justify-center rounded-xl border border-border"
                        style={{ backgroundColor: item.category_tag_color }}
                      >
                        <LucideIconBySlug
                          slug={item.category_tag_icon || LUCIDE_ICON_FALLBACK_CATEGORY}
                          className="size-4 text-foreground"
                        />
                      </span>
                      <span>{item.category_tag_name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(item)}
                      >
                        編集
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => void onDelete(item.category_tag_id)}
                      >
                        削除
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            ))
          )}
        </ul>
      )}

      <form onSubmit={onCreate} className="flex max-w-lg flex-col gap-3">
        <div className="grid gap-2">
          <Label htmlFor="category_tag_name">新しいタグ名</Label>
          <Input
            id="category_tag_name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="category_tag_color">色</Label>
          <Input
            id="category_tag_color"
            type="color"
            className="h-10 w-14 p-1"
            value={/^#[0-9A-Fa-f]{6}$/.test(color) ? color : "#6c757d"}
            onChange={(e) => setColor(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label>アイコン</Label>
          <IconPickerGrid
            options={LUCIDE_CATEGORY_PICKER}
            value={createIcon}
            onChange={setCreateIcon}
            ariaLabel="新規カテゴリタグのアイコン"
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
