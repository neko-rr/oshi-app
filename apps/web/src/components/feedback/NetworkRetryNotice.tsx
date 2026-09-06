"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";

type Props = {
  message: string;
  /** オフライン／電波弱のとき true（文言強調用） */
  offline?: boolean;
  onRetry?: () => void;
};

/**
 * API 失敗時の案内＋再試行。店内の電波弱対策。
 */
export function NetworkRetryNotice({ message, offline, onRetry }: Props) {
  const t = useTranslations("Common");

  return (
    <div
      className={[
        "flex flex-col gap-2 rounded-md border px-3 py-2 text-sm",
        offline
          ? "border-amber-500/50 bg-amber-500/10 text-foreground"
          : "border-destructive/40 bg-destructive/5 text-destructive",
      ].join(" ")}
      role="alert"
    >
      <p>{message}</p>
      {onRetry ? (
        <div>
          <Button type="button" size="sm" variant="outline" onClick={onRetry}>
            {t("retry")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
