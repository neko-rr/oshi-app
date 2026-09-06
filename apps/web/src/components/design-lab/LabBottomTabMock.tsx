"use client";

import type { LabVariantId } from "@/components/design-lab/lab-meta";

const TABS = [
  { id: "gallery", label: "ギャラリー" },
  { id: "register", label: "登録" },
  { id: "search", label: "検索" },
  { id: "more", label: "その他" },
] as const;

type LabBottomTabMockProps = {
  variant: LabVariantId;
  /** アクティブ見本（既定はギャラリー） */
  activeId?: (typeof TABS)[number]["id"];
  /** 横向き想定の圧縮表示 */
  compact?: boolean;
};

/**
 * Lab 用下部タブ見本。A/B/C は配置差のみ（色は親の --lab-primary）。
 */
export default function LabBottomTabMock({
  variant,
  activeId = "gallery",
  compact = false,
}: LabBottomTabMockProps) {
  const pad = compact
    ? "py-1"
    : variant === "c"
      ? "py-2.5"
      : variant === "b"
        ? "py-2"
        : "py-1.5";

  return (
    <nav
      className={`grid grid-cols-4 gap-0.5 border-t border-[var(--lab-border)] bg-[var(--lab-surface)] px-1 ${pad}`}
      aria-label="下部タブ（見本）"
    >
      {TABS.map((tab) => {
        const active = tab.id === activeId;
        const emphasizeRegister =
          variant === "b" && tab.id === "register" && !compact;
        return (
          <span
            key={tab.id}
            className={[
              "flex flex-col items-center justify-center rounded text-center",
              compact ? "gap-0 text-[8px]" : "gap-0.5 text-[9px]",
              active
                ? "font-semibold text-[var(--lab-primary)]"
                : "lab-muted",
              emphasizeRegister
                ? "scale-105 bg-[var(--lab-accent-soft)] py-0.5"
                : "",
            ].join(" ")}
          >
            <span
              className={[
                "rounded-full bg-current opacity-40",
                compact ? "size-1.5" : emphasizeRegister ? "size-2.5" : "size-2",
              ].join(" ")}
              aria-hidden
            />
            {compact && variant === "a" ? null : (
              <span className={compact ? "leading-none" : undefined}>
                {tab.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
