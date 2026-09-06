"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type Props = {
  open: boolean;
  onClose: () => void;
  reason?: "save" | "photo" | "barcode" | "assist" | "generic";
};

/** ゲストが業務 API に触れたときの本登録誘導。 */
export function RegistrationRequiredDialog({
  open,
  onClose,
  reason = "generic",
}: Props) {
  const t = useTranslations("Guest");
  if (!open) return null;

  const bodyKey =
    reason === "save"
      ? "gateSave"
      : reason === "photo"
        ? "gatePhoto"
        : reason === "barcode"
          ? "gateBarcode"
          : reason === "assist"
            ? "gateAssist"
            : "gateGeneric";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reg-required-title"
    >
      <div className="w-full max-w-md rounded-md border border-border bg-card p-4 text-card-foreground shadow-lg">
        <h2 id="reg-required-title" className="text-lg font-semibold">
          {t("gateTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t(bodyKey)}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button asChild>
            <Link href="/auth/upgrade">{t("goUpgrade")}</Link>
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>
            {t("gateClose")}
          </Button>
        </div>
      </div>
    </div>
  );
}
