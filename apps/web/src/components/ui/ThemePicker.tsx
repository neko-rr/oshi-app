"use client";

import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { THEME_OPTIONS, useTheme } from "@/hooks/useTheme";
import { themeSwatchRimClass } from "@/lib/themes/catalog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/** getComputedStyle の rgb/rgba（カンマ区切り・空白区切り）を #rrggbb に */
function cssColorToHex(raw: string): string | null {
  const s = raw.trim();
  const comma = s.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/i,
  );
  const space = s.match(
    /^rgba?\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)/i,
  );
  const m = comma ?? space;
  if (!m) return null;
  const to = (n: string) =>
    Math.max(0, Math.min(255, Math.round(Number(n))))
      .toString(16)
      .padStart(2, "0");
  return `#${to(m[1])}${to(m[2])}${to(m[3])}`;
}

function useThemeSampleFgHexes(themeId: string) {
  const [mainFg, setMainFg] = useState("#------");
  const [softFg, setSoftFg] = useState("#------");

  useEffect(() => {
    if (typeof document === "undefined") return;
    const probe = document.createElement("span");
    probe.setAttribute("aria-hidden", "true");
    probe.style.position = "fixed";
    probe.style.left = "-9999px";
    probe.style.top = "0";
    probe.style.pointerEvents = "none";
    document.body.appendChild(probe);

    probe.style.color = "var(--primary-foreground)";
    const main =
      cssColorToHex(getComputedStyle(probe).color) ?? "#------";
    probe.style.color = "var(--accent-foreground)";
    const soft =
      cssColorToHex(getComputedStyle(probe).color) ?? "#------";

    document.body.removeChild(probe);
    setMainFg(main);
    setSoftFg(soft);
  }, [themeId]);

  return { mainFg, softFg };
}

/**
 * テーマ色ピッカー（Design Lab B 採用）。
 * 枠黒＝ライト / 枠白＝ダーク。塗りはカタログのスウォッチのみ。
 * 見本枠はセマンティック色（テーマ切替をそのまま反映）。
 */
export default function ThemePicker() {
  const t = useTranslations("Themes");
  const tCommon = useTranslations("Common");
  const { themeId, setTheme, isSyncing, current } = useTheme();
  const currentLabel = t(current.id as "default");
  const { mainFg, softFg } = useThemeSampleFgHexes(themeId);

  return (
    <div className="flex flex-col gap-4">
      <div
        className="stack-density-sm rounded-2xl border border-border bg-card p-4"
        aria-live="polite"
      >
        <p className="text-xs font-medium text-muted-foreground">
          {t("previewTitle")}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            {t("previewButton")}
          </span>
          <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            {t("previewChip")}
          </span>
          <span className="text-sm text-foreground">{t("previewBody")}</span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {t("autoFgHint", { mainFg, softFg })}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t("previewThemeName", { label: currentLabel })}
        </p>
      </div>

      <ul
        className="flex flex-wrap gap-3"
        role="listbox"
        aria-label={t("ariaList")}
      >
        {THEME_OPTIONS.map((opt) => {
          const active = opt.id === themeId;
          const rim = themeSwatchRimClass(opt.scheme);
          const label = t(opt.id as "default");
          const schemeLabel =
            opt.scheme === "dark" ? t("schemeDark") : t("schemeLight");
          const rimHint =
            opt.scheme === "dark" ? t("rimDark") : t("rimLight");
          return (
            <li key={opt.id}>
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                role="option"
                aria-selected={active}
                aria-label={t("optionAria", { label, scheme: schemeLabel })}
                title={t("optionTitle", { label, rim: rimHint })}
                onClick={() => setTheme(opt.id)}
                className={cn(
                  "size-11 rounded-full border-2 p-0 shadow-none hover:bg-transparent",
                  rim,
                  active &&
                    "scale-105 ring-2 ring-primary ring-offset-2 ring-offset-background",
                )}
                style={{ backgroundColor: opt.swatch }}
              />
            </li>
          );
        })}
      </ul>

      <p className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-full border-2 border-zinc-900 bg-primary"
            aria-hidden
          />
          {t("legendLight")}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className="inline-block size-3 rounded-full border-2 border-white bg-primary shadow-[0_0_0_1px_rgb(0_0_0_/_0.25)]"
            aria-hidden
          />
          {t("legendDark")}
        </span>
      </p>

      <p className="text-xs text-muted-foreground">
        {isSyncing
          ? tCommon("syncing")
          : t("selected", { label: currentLabel })}
      </p>
    </div>
  );
}
