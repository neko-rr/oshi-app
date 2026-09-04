"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOshiAccent } from "@/hooks/useOshiAccent";
import {
  DEFAULT_MAIN_HEX,
  normalizeHex,
  OSHI_SWATCH_PRESETS,
  tryResolveOshiColors,
} from "@/lib/oshiContrast";
import { cn } from "@/lib/utils";

function SwatchRow({
  label,
  value,
  onPick,
  ariaLabel,
}: {
  label: string;
  value: string;
  onPick: (hex: string) => void;
  ariaLabel: string;
}) {
  const t = useTranslations("OshiAccent");
  const [hexText, setHexText] = useState(value);

  useEffect(() => {
    setHexText(value);
  }, [value]);

  const commitHex = (raw: string) => {
    try {
      const hex = normalizeHex(raw);
      onPick(hex);
      setHexText(hex);
    } catch {
      setHexText(value);
    }
  };

  return (
    <div className="stack-density-sm">
      <p className="text-sm font-medium text-foreground">{label}</p>
      <ul className="flex flex-wrap gap-2.5" role="listbox" aria-label={ariaLabel}>
        {OSHI_SWATCH_PRESETS.map((sw) => {
          const active = sw.hex.toLowerCase() === value.toLowerCase();
          return (
            <li key={sw.hex}>
              <Button
                type="button"
                variant="outline"
                size="icon"
                role="option"
                aria-selected={active}
                aria-label={t(`swatches.${sw.labelKey}`)}
                title={t(`swatches.${sw.labelKey}`)}
                onClick={() => onPick(sw.hex)}
                className={cn(
                  "size-10 rounded-full border-2 border-zinc-900 p-0 shadow-none hover:bg-transparent",
                  active &&
                    "scale-105 ring-2 ring-ring ring-offset-2 ring-offset-background",
                )}
                style={{ backgroundColor: sw.hex }}
              />
            </li>
          );
        })}
      </ul>
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(value) ? value : DEFAULT_MAIN_HEX}
          onChange={(e) => onPick(e.target.value)}
          className="h-10 w-14 cursor-pointer p-1"
          aria-label={t("customColorAria", { role: label })}
        />
        <Input
          type="text"
          value={hexText}
          onChange={(e) => setHexText(e.target.value)}
          onBlur={() => commitHex(hexText)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitHex(hexText);
            }
          }}
          className="font-mono text-sm uppercase"
          maxLength={7}
          spellCheck={false}
          aria-label={t("hexAria", { role: label })}
        />
      </div>
    </div>
  );
}

/** 推し色パネル。見本内プレビューが既定。全体試し見は明示トグル（OFF既定）。 */
export function OshiAccentPanel() {
  const t = useTranslations("OshiAccent");
  const {
    draft,
    resolved,
    server,
    previewLive,
    setMainHex,
    setSubHex,
    setPreviewLive,
    applyLocked,
    saveToServer,
  } = useOshiAccent();
  const previewId = useId();
  const [lockHint, setLockHint] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);

  // 画面を離れるときは全体プレビューを必ずオフ（テーマ干渉を残さない）
  useEffect(() => {
    return () => setPreviewLive(false);
  }, [setPreviewLive]);

  const pickMain = (hex: string) => {
    if (!tryResolveOshiColors(hex, draft.sub_hex)) return;
    setMainHex(hex);
  };
  const pickSub = (hex: string) => {
    if (!tryResolveOshiColors(draft.main_hex, hex)) return;
    setSubHex(hex);
  };

  const onApplyClick = async () => {
    if (applyLocked) {
      setLockHint(true);
      return;
    }
    const result = await saveToServer({ active: true });
    if (!result.ok) {
      setSaveMsg(t("saveFailed"));
      return;
    }
    setSaveMsg(t("saveOk"));
  };

  return (
    <div className="stack-density px-1 pt-1">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">{t("addonLabel")}</span>
      </div>

      <p className="text-sm text-muted-foreground">{t("hint")}</p>

      <SwatchRow
        label={t("mainLabel")}
        value={draft.main_hex}
        onPick={pickMain}
        ariaLabel={t("mainAria")}
      />
      <SwatchRow
        label={t("subLabel")}
        value={draft.sub_hex}
        onPick={pickSub}
        ariaLabel={t("subAria")}
      />

      <div
        id={previewId}
        className="stack-density-sm rounded-2xl border border-border bg-card p-4"
        aria-live="polite"
      >
        <p className="text-xs font-medium text-muted-foreground">
          {t("previewTitle")}
        </p>
        {resolved ? (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span
              className="inline-flex items-center rounded-md px-4 py-2 text-sm font-medium"
              style={{
                backgroundColor: resolved.main_hex,
                color: resolved.main_foreground,
              }}
            >
              {t("previewButton")}
            </span>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
              style={{
                backgroundColor: resolved.soft_bg,
                color: resolved.soft_foreground,
              }}
            >
              {t("previewChip")}
            </span>
            <span className="text-sm text-foreground">{t("previewBody")}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-destructive">{t("contrastError")}</p>
        )}
        {resolved ? (
          <p className="mt-2 text-xs text-muted-foreground">
            {t("autoFgHint", {
              mainFg: resolved.main_foreground,
              softFg: resolved.soft_foreground,
            })}
          </p>
        ) : null}
      </div>

      <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          className="mt-1 size-4 accent-primary"
          checked={previewLive}
          disabled={!resolved}
          onChange={(e) => setPreviewLive(e.target.checked)}
        />
        <span>
          <span className="font-medium">{t("livePreviewLabel")}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">
            {t("livePreviewHint")}
          </span>
        </span>
      </label>
      {previewLive ? (
        <p className="text-xs text-amber-700 dark:text-amber-400" role="status">
          {t("previewingAppWide")}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          onClick={() => void onApplyClick()}
          disabled={!resolved}
          aria-describedby={lockHint ? `${previewId}-lock` : undefined}
        >
          {applyLocked ? t("applyLocked") : t("apply")}
        </Button>
        {!applyLocked && server.active ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => void saveToServer({ active: false })}
          >
            {t("deactivate")}
          </Button>
        ) : null}
      </div>

      {lockHint ? (
        <p
          id={`${previewId}-lock`}
          className="text-sm text-muted-foreground"
          role="status"
        >
          {t("lockExplain")}
        </p>
      ) : null}
      {saveMsg ? (
        <p className="text-sm text-muted-foreground" role="status">
          {saveMsg}
        </p>
      ) : null}
    </div>
  );
}
