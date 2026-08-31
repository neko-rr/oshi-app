"use client";

import { useTheme } from "@/hooks/useTheme";

const THEMES = [
  { id: "default", label: "Default" },
  { id: "lime-right", label: "Lime (Right)" },
  { id: "yellow-dark", label: "Yellow (Dark)" },
  { id: "orange-dark", label: "Orange (Dark)" },
  { id: "red-dark", label: "Red (Dark)" },
  { id: "lime-dark", label: "Lime (Dark)" },
  { id: "emerald-dark", label: "Emerald (Dark)" },
  { id: "sky-dark", label: "Sky (Dark)" },
  { id: "blue-dark", label: "Blue (Dark)" },
  { id: "pink-dark", label: "Pink (Dark)" },
  { id: "purple-dark", label: "Purple (Dark)" },
] as const;

export default function ThemePicker() {
  const { themeId, setTheme, isSyncing } = useTheme();

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium">テーマ</label>
      <select
        value={themeId}
        onChange={(e) => setTheme(e.target.value)}
        className="rounded border border-border bg-background px-2 py-1 text-foreground"
        aria-label="テーマを選択"
      >
        {THEMES.map((t) => (
          <option key={t.id} value={t.id}>
            {t.label}
          </option>
        ))}
      </select>
      <span className="text-xs text-muted-foreground">
        {isSyncing ? "同期中…" : "保存済"}
      </span>
    </div>
  );
}
