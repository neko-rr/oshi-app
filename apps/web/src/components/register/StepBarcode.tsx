"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { BarcodeScanner } from "@/components/barcode/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DecodedBarcode } from "@/lib/barcode/formats";

export type OwnedProductHint = {
  registered_product_id: number;
  product_name: string | null;
};

type Props = {
  barcode: string;
  note: string | null;
  lookingUp: boolean;
  ownedHint: OwnedProductHint | null;
  onBarcodeChange: (value: string) => void;
  onDetected: (decoded: DecodedBarcode) => void;
  onLookupAndNext: () => void;
  onSkip: () => void;
  onManualAll: () => void;
};

export function StepBarcode({
  barcode,
  note,
  lookingUp,
  ownedHint,
  onBarcodeChange,
  onDetected,
  onLookupAndNext,
  onSkip,
  onManualAll,
}: Props) {
  const t = useTranslations("Register.barcode");
  const tCommon = useTranslations("Common");

  return (
    <div className="flex max-w-md flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      <BarcodeScanner disabled={lookingUp} onDetected={onDetected} />

      <div className="grid gap-2">
        <Label htmlFor="wizard_barcode">{t("label")}</Label>
        <Input
          id="wizard_barcode"
          inputMode="numeric"
          autoComplete="off"
          value={barcode}
          onChange={(e) => onBarcodeChange(e.target.value)}
          placeholder={t("placeholder")}
        />
        {note ? (
          <p className="text-xs text-muted-foreground" role="status">
            {note}
          </p>
        ) : null}
        {ownedHint ? (
          <p
            className="rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground"
            role="status"
          >
            {t("ownedPrefix")}{" "}
            <Link
              href={`/gallery/${ownedHint.registered_product_id}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {ownedHint.product_name?.trim() ||
                `#${ownedHint.registered_product_id}`}
            </Link>{" "}
            {t("ownedSuffix")}
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={lookingUp || !barcode.trim()}
          onClick={onLookupAndNext}
        >
          {lookingUp ? t("lookingUp") : t("lookupNext")}
        </Button>
        <Button type="button" variant="secondary" onClick={onSkip}>
          {tCommon("skip")}
        </Button>
        <Button type="button" variant="outline" onClick={onManualAll}>
          {t("manualAll")}
        </Button>
      </div>
    </div>
  );
}
