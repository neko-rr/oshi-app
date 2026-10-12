"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useRouter } from "@/i18n/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  API_PATHS,
  LUCIDE_ICON_FALLBACK_STORAGE,
  LUCIDE_STORAGE_PICKER,
} from "@oshi/shared";
import IconPickerGrid from "@/components/settings/IconPickerGrid";
import { DismissedPresetsPanel } from "@/components/settings/DismissedPresetsPanel";
import { TagOrderControls } from "@/components/settings/TagOrderControls";
import { LucideIconBySlug } from "@/components/ui/LucideIconBySlug";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";
import { isPresetSlot } from "@/lib/tagPresets";
import { GuestServerGate } from "@/components/auth/GuestServerGate";
import { runAfterTick } from "@/lib/runAfterTick";

type StorageLocationItem = {
  storage_location_id: number;
  storage_location_name: string;
  storage_location_icon?: string;
  storage_count_per_1?: number;
  slot?: number | null;
};

function capacityOf(item: StorageLocationItem): number {
  const count = item.storage_count_per_1;
  return typeof count === "number" && count >= 1 ? count : 1;
}

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

export default function StorageLocationsSettingsPage() {
  const t = useTranslations("StorageLocations");
  const tCommon = useTranslations("Common");
  const tPresets = useTranslations("TagPresets");
  const router = useRouter();
  const [items, setItems] = useState<StorageLocationItem[]>([]);
  const [dismissedSlots, setDismissedSlots] = useState<number[]>([]);
  const [reordering, setReordering] = useState(false);
  const [name, setName] = useState("");
  const [createIcon, setCreateIcon] = useState<string>(
    LUCIDE_ICON_FALLBACK_STORAGE,
  );
  const [createCapacity, setCreateCapacity] = useState("1");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState<string>(LUCIDE_ICON_FALLBACK_STORAGE);
  const [editCapacity, setEditCapacity] = useState("1");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  function labelForSlot(slot: number) {
    const key = `storage.${slot}` as "storage.1";
    return tPresets.has(key) ? tPresets(key) : tPresets("presetFallback", { slot });
  }

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
        throw new Error(
          tCommon("fetchFailedPrefix", {
            detail: (await res.text()).slice(0, 160),
          }),
        );
      }
      const json = (await res.json()) as {
        items?: StorageLocationItem[];
        dismissed_preset_slots?: number[];
      };
      setItems(json.items ?? []);
      setDismissedSlots(json.dismissed_preset_slots ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tCommon("loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [getToken, tCommon]);

  useEffect(() => runAfterTick(() => {
    void load();
  }), [load]);

  function startEdit(item: StorageLocationItem) {
    setEditingId(item.storage_location_id);
    setEditName(item.storage_location_name);
    setEditIcon(item.storage_location_icon || LUCIDE_ICON_FALLBACK_STORAGE);
    setEditCapacity(String(capacityOf(item)));
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
  }

  function readCapacity(text: string): number | null {
    const amount = Number(text.trim());
    if (!Number.isInteger(amount) || amount < 1 || amount > 9999) return null;
    return amount;
  }

  async function onCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const capacity = readCapacity(createCapacity);
    if (capacity == null) {
      setError(t("capacityInvalid"));
      return;
    }
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
          storage_location_icon: createIcon,
          storage_count_per_1: capacity,
        }),
      });
      if (!res.ok) {
        throw new Error(
          tCommon("addFailedPrefix", {
            detail: (await res.text()).slice(0, 160),
          }),
        );
      }
      setName("");
      setCreateIcon(LUCIDE_ICON_FALLBACK_STORAGE);
      setCreateCapacity("1");
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("addFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function onSaveEdit(e: FormEvent) {
    e.preventDefault();
    if (editingId == null || !editName.trim()) return;
    const capacity = readCapacity(editCapacity);
    if (capacity == null) {
      setError(t("capacityInvalid"));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(
        `${apiBase()}${API_PATHS.storageLocations}/${editingId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            storage_location_name: editName.trim(),
            storage_location_icon: editIcon,
            storage_count_per_1: capacity,
          }),
        },
      );
      if (!res.ok) {
        throw new Error(
          tCommon("updateFailedPrefix", {
            detail: (await res.text()).slice(0, 160),
          }),
        );
      }
      setEditingId(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("updateFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function persistOrder(nextItems: StorageLocationItem[]) {
    setReordering(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const orderedIds = nextItems.map((i) => i.storage_location_id);
      const res = await fetch(`${apiBase()}${API_PATHS.storageLocationsOrder}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ordered_ids: orderedIds }),
      });
      if (!res.ok) {
        throw new Error(
          tCommon("reorderFailedPrefix", {
            detail: (await res.text()).slice(0, 160),
          }),
        );
      }
      const json = (await res.json()) as { items?: StorageLocationItem[] };
      setItems(json.items ?? nextItems);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("reorderFailed"));
      await load();
    } finally {
      setReordering(false);
    }
  }

  function moveItem(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];
    setItems(next);
    void persistOrder(next);
  }

  async function onRestorePreset(slot: number) {
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(
        `${apiBase()}${API_PATHS.storageLocationsRestorePreset}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ slot }),
        },
      );
      if (!res.ok) {
        throw new Error(
          tCommon("restoreFailedPrefix", {
            detail: (await res.text()).slice(0, 160),
          }),
        );
      }
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("restoreFailed"));
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
        throw new Error(
          tCommon("deleteFailedPrefix", {
            detail: (await res.text()).slice(0, 160),
          }),
        );
      }
      if (editingId === id) setEditingId(null);
      await load();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : tCommon("deleteFailed"));
    }
  }

  return (
    <GuestServerGate title={t("title")}>
    <div className="stack-density-lg">
      <div>
        <Link
          href="/settings"
          className="text-sm text-muted-foreground underline-offset-4 hover:underline"
        >
          {tCommon("backToSettings")}
        </Link>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <DismissedPresetsPanel
        slots={dismissedSlots}
        labelForSlot={labelForSlot}
        onRestore={(slot) => void onRestorePreset(slot)}
        busy={saving || reordering}
      />

      {loading ? (
        <p className="text-sm text-muted-foreground">{tCommon("loading")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.length === 0 ? (
            <li className="text-sm text-muted-foreground">{tCommon("emptyYet")}</li>
          ) : (
            items.map((item, index) => (
              <li
                key={item.storage_location_id}
                className="rounded-2xl border border-border bg-card px-3 py-2"
              >
                {editingId === item.storage_location_id ? (
                  <form onSubmit={onSaveEdit} className="flex flex-col gap-3">
                    <div className="grid min-w-[10rem] gap-1">
                      <Label
                        htmlFor={`edit-name-${item.storage_location_id}`}
                      >
                        {tCommon("name")}
                      </Label>
                      <Input
                        id={`edit-name-${item.storage_location_id}`}
                        required
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label>{tCommon("icon")}</Label>
                      <IconPickerGrid
                        options={LUCIDE_STORAGE_PICKER}
                        value={editIcon}
                        onChange={setEditIcon}
                        ariaLabel={t("iconAria")}
                      />
                    </div>
                    <div className="grid gap-1">
                      <Label htmlFor={`edit-capacity-${item.storage_location_id}`}>
                        {t("capacityLabel")}
                      </Label>
                      <Input
                        id={`edit-capacity-${item.storage_location_id}`}
                        inputMode="numeric"
                        className="min-h-11 w-28"
                        value={editCapacity}
                        onChange={(e) => setEditCapacity(e.target.value)}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={saving}>
                        {saving ? tCommon("saving") : tCommon("save")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                      >
                        {tCommon("cancel")}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center gap-2">
                    <TagOrderControls
                      onMoveUp={() => moveItem(index, -1)}
                      onMoveDown={() => moveItem(index, 1)}
                      disableUp={index === 0}
                      disableDown={index === items.length - 1}
                      busy={reordering}
                    />
                    <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-2.5 text-sm">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-border bg-muted/50">
                          <LucideIconBySlug
                            slug={
                              item.storage_location_icon ||
                              LUCIDE_ICON_FALLBACK_STORAGE
                            }
                            className="size-4 text-foreground"
                          />
                        </span>
                        <span className="truncate">
                          {item.storage_location_name}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {t("capacityShort", { count: capacityOf(item) })}
                        </span>
                        {isPresetSlot(item.slot) ? (
                          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                            {tCommon("presetBadge")}
                          </span>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(item)}
                        >
                          {tCommon("edit")}
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() =>
                            void onDelete(item.storage_location_id)
                          }
                        >
                          {isPresetSlot(item.slot)
                            ? tCommon("hidden")
                            : tCommon("delete")}
                        </Button>
                      </div>
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
          <Label htmlFor="storage_location_name">{t("newName")}</Label>
          <Input
            id="storage_location_name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="storage_capacity">{t("capacityLabel")}</Label>
          <Input
            id="storage_capacity"
            inputMode="numeric"
            className="min-h-11 w-28"
            value={createCapacity}
            onChange={(e) => setCreateCapacity(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">{t("capacityHint")}</p>
        </div>
        <div className="grid gap-2">
          <Label>{tCommon("icon")}</Label>
          <IconPickerGrid
            options={LUCIDE_STORAGE_PICKER}
            value={createIcon}
            onChange={setCreateIcon}
            ariaLabel={t("iconAriaNew")}
          />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" disabled={saving}>
          {saving ? tCommon("adding") : tCommon("add")}
        </Button>
      </form>
    </div>
    </GuestServerGate>
  );
}
