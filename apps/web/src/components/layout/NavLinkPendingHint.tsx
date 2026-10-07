"use client";

import { useLinkStatus } from "next/link";
import { MascotNavPendingSilhouette } from "@/components/mascot/MascotSilhouetteMark";
import { cn } from "@/lib/utils";

type Props = {
  /** 親を relative にし、はみ出し位置を指定する */
  className?: string;
};

/**
 * Link 配下専用。遷移が実際に遅いときだけシルエットを出す（100ms 遅延）。
 * レイアウトシフトを避けるため常に absolute（通常は非表示）。
 * @see https://nextjs.org/docs/app/api-reference/functions/use-link-status
 */
export function NavLinkPendingHint({ className }: Props) {
  const { pending } = useLinkStatus();

  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute size-5 opacity-0",
        pending && "nav-link-pending-hint--active",
        className,
      )}
    >
      {pending ? <MascotNavPendingSilhouette /> : null}
    </span>
  );
}

/** タブ全体を薄く脈動させるオーバーレイ（Link 配下） */
export function NavLinkPendingOverlay() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-md bg-primary/10 opacity-0",
        pending && "nav-link-pending-overlay--active",
      )}
    />
  );
}
