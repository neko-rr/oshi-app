"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { API_PATHS } from "@oshi/shared";
import { createClient } from "@/lib/client";
import { prepareRegisterPhoto } from "@/lib/prepareRegisterPhoto";
import { replaceProductPhoto } from "@/lib/replaceProductPhoto";
import { runAfterTick } from "@/lib/runAfterTick";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { NetworkRetryNotice } from "@/components/feedback/NetworkRetryNotice";
import { ImageSourcePicker } from "@/components/photo/ImageSourcePicker";
import { Button } from "@/components/ui/button";

type Props = {
  registeredProductId: number;
};

/**
 * 詳細の写真を1枚だけ撮り直す。プレビューしてから保存する。
 */
export function ProductPhotoReplace({ registeredProductId }: Props) {
  const t = useTranslations("ProductDetail");
  const tCommon = useTranslations("Common");
  const tGallery = useTranslations("Gallery");
  const router = useRouter();
  const { flashSuccess } = useFeedback();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    if (!file) {
      return runAfterTick(() => setPreviewUrl(null));
    }
    const url = URL.createObjectURL(file);
    const cancel = runAfterTick(() => setPreviewUrl(url));
    return () => {
      cancel();
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function clearPick() {
    setFile(null);
    setPreviewUrl(null);
    setError(null);
    setOffline(false);
  }

  async function onPick(raw: File | null) {
    setError(null);
    setOffline(false);
    if (!raw) {
      setFile(null);
      return;
    }
    setCompressing(true);
    try {
      const result = await prepareRegisterPhoto(raw, { plan: "free" });
      if (!result.ok) {
        setFile(null);
        setError(
          result.code === "too_large"
            ? t("replaceTooLarge")
            : t("replaceCompressFailed"),
        );
        return;
      }
      setFile(result.file);
    } finally {
      setCompressing(false);
    }
  }

  async function onSave() {
    if (!file || saving) return;
    const base = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "");
    if (!base) {
      setError(tGallery("apiBaseMissing"));
      return;
    }
    setSaving(true);
    setError(null);
    setOffline(false);
    try {
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        router.push("/auth/login");
        return;
      }
      const result = await replaceProductPhoto({
        photosUrl: `${base}${API_PATHS.photos}`,
        productUrl: `${base}${API_PATHS.products}/${registeredProductId}`,
        accessToken: data.session.access_token,
        file,
      });
      if (!result.ok) {
        const isOffline =
          typeof navigator !== "undefined" && navigator.onLine === false;
        setOffline(isOffline);
        setError(isOffline ? tCommon("offlineHint") : t("replaceFailed"));
        return;
      }
      flashSuccess(tCommon("savedFlash"));
      clearPick();
      router.refresh();
    } catch {
      const isOffline =
        typeof navigator !== "undefined" && navigator.onLine === false;
      setOffline(isOffline);
      setError(isOffline ? tCommon("offlineHint") : t("replaceFailed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex max-w-lg flex-col gap-3">
      <div>
        <p className="text-sm font-medium">{t("replacePhotoLabel")}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("replacePhotoHint")}
        </p>
      </div>
      <div className="grid gap-2">
        <p className="text-sm font-medium">{t("replacePick")}</p>
        <ImageSourcePicker
          idPrefix="detail_photo_replace"
          disabled={compressing || saving}
          fileLabel={t("replacePickFile")}
          cameraLabel={t("replaceTakeCamera")}
          onFile={(picked) => void onPick(picked)}
        />
        {compressing ? (
          <p className="text-xs text-muted-foreground" role="status">
            {t("replaceCompressing")}
          </p>
        ) : null}
      </div>
      {previewUrl && file ? (
        <div className="overflow-hidden rounded-xl bg-muted ring-1 ring-border">
          {/* eslint-disable-next-line @next/next/no-img-element -- 保存前のローカルプレビュー */}
          <img
            src={previewUrl}
            alt={t("replacePreviewAlt")}
            className="aspect-[4/5] max-h-64 w-full object-contain"
          />
        </div>
      ) : null}
      {error ? (
        <NetworkRetryNotice
          message={error}
          offline={offline}
          onRetry={file ? () => void onSave() : undefined}
        />
      ) : null}
      {file ? (
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="min-h-11"
            disabled={saving || compressing}
            onClick={() => void onSave()}
          >
            {saving ? t("replaceSaving") : t("replaceSave")}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            disabled={saving}
            onClick={clearPick}
          >
            {t("replaceCancel")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
