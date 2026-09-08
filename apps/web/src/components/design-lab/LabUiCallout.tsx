"use client";

import type { ReactNode } from "react";
import {
  labUiCalloutGlyph,
  labUiCalloutMeta,
  type LabUiCalloutId,
} from "@/components/design-lab/lab-ui-callouts";
import { cn } from "@/lib/utils";

type LabUiCalloutProps = {
  id: LabUiCalloutId;
  show: boolean;
  children: ReactNode;
  className?: string;
  /** バッジを左上ではなく右上に */
  badge?: "start" | "end";
};

/**
 * 案A/B/C 見本内の部品に会話用番号を付ける。
 * show=false のときは children のみ。
 */
export function LabUiCallout({
  id,
  show,
  children,
  className,
  badge = "start",
}: LabUiCalloutProps) {
  const meta = labUiCalloutMeta(id);
  const glyph = labUiCalloutGlyph(id);
  if (!show || !meta || !glyph) {
    if (className) {
      return <div className={className}>{children}</div>;
    }
    return <>{children}</>;
  }
  return (
    <div
      className={cn("relative", className)}
      data-lab-ui-callout={meta.n}
      data-lab-ui-callout-id={id}
      title={`案内UI ${glyph} ${meta.label}`}
    >
      <span
        className={cn(
          "pointer-events-none absolute z-20 inline-flex min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 py-0.5 text-[10px] font-bold leading-none text-white shadow ring-2 ring-white",
          badge === "end" ? "-right-1 -top-1" : "-left-1 -top-1",
        )}
        aria-hidden
      >
        {glyph}
      </span>
      {children}
    </div>
  );
}
