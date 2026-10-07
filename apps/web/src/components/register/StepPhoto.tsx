"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw, RotateCw } from "@/lib/icons";
import {
  prepareRegisterPhoto,
  rotateRegisterPhoto,
} from "@/lib/prepareRegisterPhoto";
import { runAfterTick } from "@/lib/runAfterTick";

type Props = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
};

/**
 * 手順2: 正面写真。選択直後に圧縮（無料ティア）→ object URL プレビュー。
 */
export function StepPhoto({
  file,
  onFileChange,
  onNext,
  onSkip,
  onBack,
}: Props) {
  const t = useTranslations("Register.photo");
  const tCommon = useTranslations("Common");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const [compressError, setCompressError] = useState<string | null>(null);

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

  function clearPhoto() {
    onFileChange(null);
    setCompressError(null);
    const el = document.getElementById(
      "wizard_photo",
    ) as HTMLInputElement | null;
    if (el) el.value = "";
  }

  async function onPick(raw: File | null) {
    setCompressError(null);
    if (!raw) {
      onFileChange(null);
      return;
    }
    setCompressing(true);
    try {
      // プラン未導入時は free。有料化後は resolvePhotoQualityTier(plan) 経由
      const result = await prepareRegisterPhoto(raw, { plan: "free" });
      if (!result.ok) {
        onFileChange(null);
        setCompressError(
          result.code === "too_large" ? t("tooLarge") : t("compressFailed"),
        );
        const el = document.getElementById(
          "wizard_photo",
        ) as HTMLInputElement | null;
        if (el) el.value = "";
        return;
      }
      onFileChange(result.file);
    } finally {
      setCompressing(false);
    }
  }

  async function onRotate(degrees: 90 | -90) {
    if (!file || compressing) return;
    setCompressError(null);
    setCompressing(true);
    try {
      const result = await rotateRegisterPhoto(file, degrees, { plan: "free" });
      if (!result.ok) {
        setCompressError(
          result.code === "too_large" ? t("tooLarge") : t("compressFailed"),
        );
        return;
      }
      onFileChange(result.file);
    } finally {
      setCompressing(false);
    }
  }

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="wizard_photo">{t("label")}</Label>
        <Input
          id="wizard_photo"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={compressing}
          onChange={(e) => void onPick(e.target.files?.[0] ?? null)}
        />
        {compressing ? (
          <p className="text-xs text-muted-foreground" role="status">
            {t("compressing")}
          </p>
        ) : null}
        {compressError ? (
          <p className="text-sm text-destructive" role="alert">
            {compressError}
          </p>
        ) : null}
        {file && !compressing ? (
          <p className="text-xs text-muted-foreground">
            {t("selected", { name: file.name })}
          </p>
        ) : null}
      </div>

      {previewUrl ? (
        <div className="overflow-hidden rounded-xl border border-border bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob URL */}
          <img
            src={previewUrl}
            alt={t("previewAlt")}
            className="mx-auto max-h-[min(50vh,22rem)] w-full object-contain landscape:max-h-[min(42vh,16rem)]"
          />
          <div className="flex flex-wrap gap-2 border-t border-border p-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => void onRotate(-90)}
              disabled={compressing}
            >
              <RotateCcw className="size-4" aria-hidden />
              {t("rotateLeft")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={() => void onRotate(90)}
              disabled={compressing}
            >
              <RotateCw className="size-4" aria-hidden />
              {t("rotateRight")}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="min-h-11"
              onClick={clearPhoto}
              disabled={compressing}
            >
              {t("retake")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-10 -mx-1 flex flex-wrap gap-2 border-t border-border bg-background/95 px-1 py-2 backdrop-blur lg:static lg:bottom-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <Button type="button" onClick={onNext} disabled={compressing}>
          {tCommon("next")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={onSkip}
          disabled={compressing}
        >
          {tCommon("skip")}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={compressing}
        >
          {tCommon("back")}
        </Button>
      </div>
    </div>
  );
}
