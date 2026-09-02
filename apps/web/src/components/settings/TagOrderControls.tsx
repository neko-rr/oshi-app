"use client";

import { ChevronDown, ChevronUp } from "@/lib/icons";
import { Button } from "@/components/ui/button";

type TagOrderControlsProps = {
  onMoveUp: () => void;
  onMoveDown: () => void;
  disableUp: boolean;
  disableDown: boolean;
  busy?: boolean;
};

/** 設定一覧の並び替え（↑↓）。ドラッグよりモバイルで確実。 */
export function TagOrderControls({
  onMoveUp,
  onMoveDown,
  disableUp,
  disableDown,
  busy = false,
}: TagOrderControlsProps) {
  return (
    <div className="flex shrink-0 flex-col gap-0.5" aria-label="並び替え">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-8"
        disabled={disableUp || busy}
        onClick={onMoveUp}
        aria-label="上へ"
      >
        <ChevronUp className="size-4" />
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        className="size-8"
        disabled={disableDown || busy}
        onClick={onMoveDown}
        aria-label="下へ"
      >
        <ChevronDown className="size-4" />
      </Button>
    </div>
  );
}
