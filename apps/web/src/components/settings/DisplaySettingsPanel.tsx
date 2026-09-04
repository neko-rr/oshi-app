"use client";

import { useTranslations } from "next-intl";
import {
  useDisplaySettings,
  type DisplayLevel,
} from "@/hooks/useDisplaySettings";
import { SteppedPresetSlider } from "@/components/settings/SteppedPresetSlider";
import { Button } from "@/components/ui/button";
import {
  GALLERY_CARD_FIELD_IDS,
  GALLERY_LAYOUT_IDS,
  LANDING_PAGE_IDS,
  LIST_SORT_IDS,
  type GalleryCardFieldId,
  type GalleryLayoutId,
  type LandingPageId,
  type ListSortId,
} from "@/lib/displayPrefs";
import { cn } from "@/lib/utils";

type ChoiceGroupProps<T extends string> = {
  legend: string;
  value: T;
  options: readonly { id: T; label: string; hint?: string }[];
  onChange: (id: T) => void;
};

function ChoiceGroup<T extends string>({
  legend,
  value,
  options,
  onChange,
}: ChoiceGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium text-foreground">{legend}</legend>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={legend}>
        {options.map((opt) => {
          const active = opt.id === value;
          return (
            <Button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={active}
              title={opt.hint}
              variant={active ? "default" : "outline"}
              onClick={() => onChange(opt.id)}
              className={cn("min-h-10 px-3 py-2 text-sm")}
            >
              {opt.label}
            </Button>
          );
        })}
      </div>
    </fieldset>
  );
}

type FieldSwitchProps = {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (on: boolean) => void;
};

function FieldSwitch({ id, label, checked, onCheckedChange }: FieldSwitchProps) {
  return (
    <div className="flex min-h-11 items-center justify-between gap-3">
      <label htmlFor={id} className="text-sm text-foreground">
        {label}
      </label>
      <Button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onCheckedChange(!checked)}
        variant="ghost"
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border border-border p-0 transition-colors hover:bg-transparent",
          checked ? "bg-primary hover:bg-primary" : "bg-muted hover:bg-muted",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 size-5 rounded-full bg-background shadow transition-transform",
            checked && "translate-x-5",
          )}
          aria-hidden
        />
      </Button>
    </div>
  );
}

/**
 * 文字・密度・並び・ギャラリー表示・着地の設定パネル。
 */
export function DisplaySettingsPanel() {
  const t = useTranslations("DisplaySettings");
  const {
    textScale,
    uiDensity,
    listSort,
    galleryLayout,
    landingPage,
    galleryShowName,
    galleryShowTags,
    galleryShowPrice,
    setTextScale,
    setUiDensity,
    setListSort,
    setGalleryLayout,
    setLandingPage,
    setGalleryShowName,
    setGalleryShowTags,
    setGalleryShowPrice,
    isSyncing,
  } = useDisplaySettings();

  const listSortOptions = LIST_SORT_IDS.map((id) => ({
    id,
    label: t(`listSortOptions.${id}` as "listSortOptions.newest"),
    hint: t(`listSortHints.${id}` as "listSortHints.newest"),
  }));

  const galleryLayoutOptions = GALLERY_LAYOUT_IDS.map((id) => ({
    id,
    label: t(`galleryLayoutOptions.${id}` as "galleryLayoutOptions.grid"),
    hint: t(`galleryLayoutHints.${id}` as "galleryLayoutHints.grid"),
  }));

  const landingPageOptions = LANDING_PAGE_IDS.map((id) => ({
    id,
    label: t(`landingPageOptions.${id}` as "landingPageOptions.home"),
  }));

  const fieldChecked: Record<GalleryCardFieldId, boolean> = {
    name: galleryShowName,
    tags: galleryShowTags,
    price: galleryShowPrice,
  };
  const fieldSetters: Record<GalleryCardFieldId, (on: boolean) => void> = {
    name: setGalleryShowName,
    tags: setGalleryShowTags,
    price: setGalleryShowPrice,
  };

  return (
    <div className="flex flex-col gap-6">
      <SteppedPresetSlider
        id="text-scale"
        label={t("textScale")}
        value={textScale}
        onChange={(v) => setTextScale(v as DisplayLevel)}
        lowLabel={t("textScaleLow")}
        highLabel={t("textScaleHigh")}
        hint={t("textScaleHint")}
      />

      <SteppedPresetSlider
        id="ui-density"
        label={t("uiDensity")}
        value={uiDensity}
        onChange={(v) => setUiDensity(v as DisplayLevel)}
        lowLabel={t("uiDensityLow")}
        highLabel={t("uiDensityHigh")}
        hint={t("uiDensityHint")}
      />

      <ChoiceGroup
        legend={t("listSort")}
        value={listSort}
        options={listSortOptions}
        onChange={(id) => setListSort(id as ListSortId)}
      />

      <ChoiceGroup
        legend={t("galleryLayout")}
        value={galleryLayout}
        options={galleryLayoutOptions}
        onChange={(id) => setGalleryLayout(id as GalleryLayoutId)}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium text-foreground">
          {t("galleryCardFields")}
        </legend>
        <p className="text-xs text-muted-foreground">{t("galleryCardFieldsHint")}</p>
        <div className="flex flex-col gap-1 rounded-md border border-border px-3 py-2">
          {GALLERY_CARD_FIELD_IDS.map((id) => (
            <FieldSwitch
              key={id}
              id={`gallery-show-${id}`}
              label={t(
                `galleryCardFieldOptions.${id}` as "galleryCardFieldOptions.name",
              )}
              checked={fieldChecked[id]}
              onCheckedChange={fieldSetters[id]}
            />
          ))}
        </div>
        <div
          className="rounded-md border border-border bg-card px-3 py-density text-card-foreground"
          aria-live="polite"
        >
          <p className="text-xs font-medium text-muted-foreground">
            {t("cardPreview")}
          </p>
          <div className="mt-2 overflow-hidden rounded-lg ring-1 ring-border">
            <div className="flex aspect-[4/5] max-h-28 items-center justify-center bg-muted text-xs text-muted-foreground">
              {t("cardPreviewPhoto")}
            </div>
            {galleryShowName || galleryShowTags || galleryShowPrice ? (
              <div className="space-y-1 px-2 py-2">
                {galleryShowName ? (
                  <p className="truncate text-sm font-medium">{t("sampleA")}</p>
                ) : null}
                {galleryShowPrice ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {t("cardPreviewPrice")}
                  </p>
                ) : null}
                {galleryShowTags ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {t("cardPreviewTags")}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </fieldset>

      <ChoiceGroup
        legend={t("landingPage")}
        value={landingPage}
        options={landingPageOptions}
        onChange={(id) => setLandingPage(id as LandingPageId)}
      />

      <div
        className="rounded-md border border-border bg-card px-4 py-density text-card-foreground"
        aria-live="polite"
      >
        <p className="text-sm font-medium">{t("preview")}</p>
        <p className="mt-1 text-sm text-muted-foreground">{t("previewBody")}</p>
        <ul className="mt-3 flex flex-col gap-y-density text-sm">
          <li className="rounded-md border border-border px-3 py-density">
            {t("sampleA")}
          </li>
          <li className="rounded-md border border-border px-3 py-density">
            {t("sampleB")}
          </li>
          <li className="rounded-md border border-border px-3 py-density">
            {t("sampleC")}
          </li>
        </ul>
      </div>

      <p className="text-xs text-muted-foreground">
        {isSyncing ? t("syncing") : t("autoSave")}
      </p>
    </div>
  );
}
