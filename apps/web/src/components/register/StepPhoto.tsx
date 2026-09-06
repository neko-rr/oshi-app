"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  file: File | null;
  onFileChange: (file: File | null) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
};

/**
 * 手順2: 正面写真。選択直後に object URL でプレビュー（撮り直し可）。
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

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  function clearPhoto() {
    onFileChange(null);
    const el = document.getElementById(
      "wizard_photo",
    ) as HTMLInputElement | null;
    if (el) el.value = "";
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
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        {file ? (
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
            <Button type="button" variant="outline" size="sm" onClick={clearPhoto}>
              {t("retake")}
            </Button>
          </div>
        </div>
      ) : null}

      <div className="sticky bottom-[calc(4.25rem+env(safe-area-inset-bottom,0px))] z-10 -mx-1 flex flex-wrap gap-2 border-t border-border bg-background/95 px-1 py-2 backdrop-blur lg:static lg:bottom-auto lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
        <Button type="button" onClick={onNext}>
          {tCommon("next")}
        </Button>
        <Button type="button" variant="secondary" onClick={onSkip}>
          {tCommon("skip")}
        </Button>
        <Button type="button" variant="outline" onClick={onBack}>
          {tCommon("back")}
        </Button>
      </div>
    </div>
  );
}
