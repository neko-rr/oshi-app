"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { API_PATHS } from "@oshi/shared";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { createClient } from "@/lib/client";
import type { GalleryListQuery } from "@/lib/galleryListQuery";
import { galleryListHref } from "@/lib/galleryListQuery";
import {
  GALLERY_VIEW_MAX,
  GALLERY_VIEW_NAME_MAX,
  galleryListQueryFromView,
  galleryViewPayloadFromQuery,
  type GalleryViewItem,
} from "@/lib/galleryViewQuery";
import { cn } from "@/lib/utils";

type Props = {
  listQuery: GalleryListQuery;
  /** URL に無いときの並び（設定既定） */
  effectiveSort: NonNullable<GalleryListQuery["sort"]>;
  initialViews: GalleryViewItem[];
};

/**
 * 保存済みビューの適用・保存・削除（ギャラリー上）。
 */
export function GallerySavedViewsBar({
  listQuery,
  effectiveSort,
  initialViews,
}: Props) {
  const t = useTranslations("Gallery");
  const tCommon = useTranslations("Common");
  const router = useRouter();
  const { setListSort } = useDisplaySettings();
  const [views, setViews] = useState(initialViews);
  const [nameDraft, setNameDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSaveForm, setShowSaveForm] = useState(false);

  const atLimit = views.length >= GALLERY_VIEW_MAX;

  async function withApiAuth(): Promise<{
    base: string;
    headers: HeadersInit;
  } | null> {
    const supabase = createClient();
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session) {
      setError(tCommon("loginRequired"));
      return null;
    }
    const base = process.env.NEXT_PUBLIC_API_BASE_URL;
    if (!base) {
      setError(t("apiBaseMissing"));
      return null;
    }
    return {
      base: base.replace(/\/$/, ""),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.session.access_token}`,
      },
    };
  }

  function applyView(view: GalleryViewItem) {
    const next = galleryListQueryFromView(view);
    if (next.sort) setListSort(next.sort);
    router.push(galleryListHref(next));
  }

  async function saveCurrent() {
    const trimmed = nameDraft.trim();
    if (!trimmed) {
      setError(t("savedViewNameRequired"));
      return;
    }
    if (atLimit) {
      setError(t("savedViewLimit", { max: GALLERY_VIEW_MAX }));
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const auth = await withApiAuth();
      if (!auth) return;
      const body = galleryViewPayloadFromQuery(
        { ...listQuery, sort: listQuery.sort ?? effectiveSort },
        trimmed,
        effectiveSort,
      );
      const res = await fetch(`${auth.base}${API_PATHS.galleryViews}`, {
        method: "POST",
        headers: auth.headers,
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let message = tCommon("fetchFailedStatus", {
          status: String(res.status),
        });
        try {
          const errBody = (await res.json()) as {
            error?: { message?: string };
          };
          if (errBody.error?.message) message = errBody.error.message;
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }
      const created = (await res.json()) as GalleryViewItem;
      setViews((prev) => [...prev, created]);
      setNameDraft("");
      setShowSaveForm(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tCommon("fetchFailed"));
    } finally {
      setSaving(false);
    }
  }

  async function removeView(view: GalleryViewItem) {
    const ok = window.confirm(
      t("savedViewDeleteConfirm", { name: view.view_name }),
    );
    if (!ok) return;
    setBusyId(view.gallery_view_id);
    setError(null);
    try {
      const auth = await withApiAuth();
      if (!auth) return;
      const res = await fetch(
        `${auth.base}${API_PATHS.galleryViews}/${view.gallery_view_id}`,
        { method: "DELETE", headers: auth.headers },
      );
      if (!res.ok) {
        throw new Error(
          tCommon("fetchFailedStatus", { status: String(res.status) }),
        );
      }
      setViews((prev) =>
        prev.filter((v) => v.gallery_view_id !== view.gallery_view_id),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : tCommon("fetchFailed"));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/60 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-xs font-medium text-muted-foreground">
          {t("savedViews")}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="min-h-9"
          disabled={saving || atLimit}
          onClick={() => setShowSaveForm((v) => !v)}
        >
          {t("savedViewSaveCurrent")}
        </Button>
        {atLimit ? (
          <span className="text-xs text-muted-foreground">
            {t("savedViewLimit", { max: GALLERY_VIEW_MAX })}
          </span>
        ) : null}
      </div>

      {showSaveForm ? (
        <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-48 flex-1">
            <Input
              value={nameDraft}
              maxLength={GALLERY_VIEW_NAME_MAX}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder={t("savedViewNamePlaceholder")}
              className="min-h-9"
              aria-label={t("savedViewNamePlaceholder")}
            />
          </div>
          <Button
            type="button"
            size="sm"
            className="min-h-9"
            disabled={saving}
            onClick={() => void saveCurrent()}
          >
            {saving ? tCommon("loading") : t("savedViewSave")}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="min-h-9"
            disabled={saving}
            onClick={() => {
              setShowSaveForm(false);
              setNameDraft("");
            }}
          >
            {t("bulkCancel")}
          </Button>
        </div>
      ) : null}

      {views.length > 0 ? (
        <div className="flex flex-wrap gap-1.5" role="list">
          {views.map((view) => (
            <div
              key={view.gallery_view_id}
              className="inline-flex items-center gap-0.5"
              role="listitem"
            >
              <button
                type="button"
                className={cn(
                  "inline-flex min-h-9 items-center rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:bg-muted/60",
                )}
                onClick={() => applyView(view)}
              >
                {view.view_name}
              </button>
              <button
                type="button"
                className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-full text-xs text-muted-foreground transition hover:bg-muted/60 hover:text-destructive"
                aria-label={t("savedViewDeleteAria", { name: view.view_name })}
                disabled={busyId === view.gallery_view_id}
                onClick={() => void removeView(view)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t("savedViewsEmpty")}</p>
      )}

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
