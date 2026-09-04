"use client";

import { cn } from "@/lib/utils";

type SteppedPresetSliderProps = {
  id: string;
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  hint?: string;
};

/**
 * 定点スナップのレンジバー。ドラッグ中も onChange で即反映する。
 */
export function SteppedPresetSlider({
  id,
  label,
  value,
  min = 1,
  max = 7,
  onChange,
  lowLabel,
  highLabel,
  hint,
}: SteppedPresetSliderProps) {
  const stops = max - min + 1;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-foreground">
          {label}
        </label>
        {hint ? (
          <span className="text-xs text-muted-foreground">{hint}</span>
        ) : null}
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn(
          "h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary",
          "[&::-webkit-slider-thumb]:size-5 [&::-webkit-slider-thumb]:appearance-none",
          "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary",
          "[&::-webkit-slider-thumb]:shadow-sm",
          "[&::-moz-range-thumb]:size-5 [&::-moz-range-thumb]:rounded-full",
          "[&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-primary",
        )}
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{lowLabel}</span>
        <span aria-hidden className="tabular-nums">
          {value}/{stops}
        </span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}
