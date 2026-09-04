"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { API_PATHS } from "@oshi/shared";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { createClient } from "@/lib/client";
import {
  REGISTER_START_STEP_IDS,
  type RegisterStartStepId,
} from "@/lib/displayPrefs";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type StorageOption = {
  storage_location_id: number;
  storage_location_name: string;
};

function apiBase(): string {
  return (
    process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ||
    "http://127.0.0.1:8000"
  );
}

export function RegisterDefaultsPanel() {
  const t = useTranslations("RegisterDefaults");
  const {
    registerStartStep,
    defaultStorageLocationId,
    setRegisterStartStep,
    setDefaultStorageLocationId,
  } = useDisplaySettings();
  const [storageItems, setStorageItems] = useState<StorageOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        if (!token || cancelled) return;
        const res = await fetch(`${apiBase()}${API_PATHS.storageLocations}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { items?: StorageOption[] };
        setStorageItems(json.items ?? []);
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // 削除済み ID は「指定しない」にフォールバック
  useEffect(() => {
    if (defaultStorageLocationId == null) return;
    if (storageItems.length === 0) return;
    const ok = storageItems.some(
      (s) => s.storage_location_id === defaultStorageLocationId,
    );
    if (!ok) setDefaultStorageLocationId(null);
  }, [defaultStorageLocationId, storageItems, setDefaultStorageLocationId]);

  const storageOptions = useMemo(
    () => [
      { value: "", label: t("storageNone") },
      ...storageItems.map((s) => ({
        value: String(s.storage_location_id),
        label: s.storage_location_name,
      })),
    ],
    [storageItems, t],
  );

  return (
    <div className="stack-density">
      <fieldset className="stack-density">
        <legend className="text-sm font-medium text-foreground">
          {t("startTitle")}
        </legend>
        <p className="text-sm text-muted-foreground">{t("startHint")}</p>
        <div className="flex flex-col gap-2">
          {REGISTER_START_STEP_IDS.map((id) => (
            <label
              key={id}
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border border-border p-3",
                registerStartStep === id && "border-primary bg-muted/40",
              )}
            >
              <input
                type="radio"
                className="mt-1"
                name="register_start_step"
                value={id}
                checked={registerStartStep === id}
                onChange={() =>
                  setRegisterStartStep(id as RegisterStartStepId)
                }
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-sm font-medium">
                  {t(`start.${id}.label`)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {t(`start.${id}.hint`)}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="stack-density">
        <Label htmlFor="default-storage">{t("storageTitle")}</Label>
        <p className="text-sm text-muted-foreground">{t("storageHint")}</p>
        <SearchableSelect
          aria-label={t("storageTitle")}
          options={storageOptions}
          value={
            defaultStorageLocationId != null
              ? String(defaultStorageLocationId)
              : ""
          }
          onChange={(v) => {
            if (!v) {
              setDefaultStorageLocationId(null);
              return;
            }
            setDefaultStorageLocationId(Number(v));
          }}
          placeholder={t("storageNone")}
          emptyLabel={t("storageEmpty")}
        />
        <p className="text-xs text-muted-foreground">{t("frequencyHint")}</p>
      </div>
    </div>
  );
}
