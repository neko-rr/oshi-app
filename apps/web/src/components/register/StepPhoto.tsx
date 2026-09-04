"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  fileName: string | null;
  onFileChange: (file: File | null) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
};

export function StepPhoto({
  fileName,
  onFileChange,
  onNext,
  onSkip,
  onBack,
}: Props) {
  const t = useTranslations("Register.photo");
  const tCommon = useTranslations("Common");

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
        {fileName ? (
          <p className="text-xs text-muted-foreground">
            {t("selected", { name: fileName })}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
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
