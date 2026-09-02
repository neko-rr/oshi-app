"use client";

import { useEffect, useMemo, useState } from "react";
import LabAdoptionMemoPanel from "@/components/design-lab/LabAdoptionMemoPanel";
import LabContrastHint from "@/components/design-lab/LabContrastHint";
import LabCvdFilters from "@/components/design-lab/LabCvdFilters";
import LabDeviceFrame from "@/components/design-lab/LabDeviceFrame";
import LabMobileQr from "@/components/design-lab/LabMobileQr";
import LabMockSurface from "@/components/design-lab/LabMockSurface";
import LabPcExpandPreview from "@/components/design-lab/LabPcExpandPreview";
import {
  LAB_CVD_MODES,
  labCvdFilterCss,
  type LabCvdModeId,
} from "@/components/design-lab/lab-cvd";
import {
  LAB_OSHI_SWATCHES,
  LAB_PHONE_ORIENTATION_MODES,
  LAB_PLATFORMS,
  LAB_SCENES,
  LAB_UI_STATES,
  LAB_VARIANTS,
  type LabPhoneOrientationId,
  type LabPhoneOrientationMode,
  type LabPlatformId,
  type LabSceneId,
  type LabUiState,
  type LabVariantId,
} from "@/components/design-lab/lab-meta";
import {
  LAB_AMBIENTS,
  LAB_TEXT_SCALES,
  labComposePreviewFilters,
  type LabAmbientId,
  type LabTextScaleId,
} from "@/components/design-lab/lab-ux-preview";

export default function DesignLabView() {
  const [platform, setPlatform] = useState<LabPlatformId>("web-pc");
  const [phoneOrientationMode, setPhoneOrientationMode] =
    useState<LabPhoneOrientationMode>("portrait");
  const [expandOpen, setExpandOpen] = useState(false);
  const [expandVariant, setExpandVariant] = useState<LabVariantId>("a");
  const [uiState, setUiState] = useState<LabUiState>("default");
  const [scene, setScene] = useState<LabSceneId>("theme-settings");
  const [oshiIndex, setOshiIndex] = useState(0);
  const [cvdMode, setCvdMode] = useState<LabCvdModeId>("none");
  const [showThumbZone, setShowThumbZone] = useState(false);
  const [textScale, setTextScale] = useState<LabTextScaleId>("normal");
  const [ambient, setAmbient] = useState<LabAmbientId>("none");
  const [labPageOrigin, setLabPageOrigin] = useState("");
  const isNarrow = platform !== "web-pc";
  const phoneOrientations: LabPhoneOrientationId[] =
    phoneOrientationMode === "both"
      ? ["portrait", "landscape"]
      : [phoneOrientationMode];
  const swatch = LAB_OSHI_SWATCHES[oshiIndex] ?? LAB_OSHI_SWATCHES[0];
  const previewFilter = labComposePreviewFilters(
    labCvdFilterCss(cvdMode),
    ambient,
  );
  const cvdMeta = LAB_CVD_MODES.find((m) => m.id === cvdMode);
  const ambientMeta = LAB_AMBIENTS.find((a) => a.id === ambient);
  const textMeta = LAB_TEXT_SCALES.find((t) => t.id === textScale);

  useEffect(() => {
    setLabPageOrigin(window.location.origin);
  }, []);

  const openExpand = (variant: LabVariantId = "a") => {
    setExpandVariant(variant);
    setExpandOpen(true);
  };

  const tools = useMemo(
    () => (
      <div className="mx-auto grid max-w-[1600px] gap-3 px-4 pb-2 md:grid-cols-3">
        <LabAdoptionMemoPanel />
        <LabContrastHint swatch={swatch} />
        {labPageOrigin ? <LabMobileQr pageOrigin={labPageOrigin} /> : null}
      </div>
    ),
    [labPageOrigin, swatch],
  );

  return (
    /* text-zinc-900 は Lab シェルのみ。プレビュー内はテーマの --lab-fg を使う */
    <div className="min-h-full bg-zinc-100">
      <LabCvdFilters />
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-zinc-100/95 px-4 py-3 text-zinc-900 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Design Lab（開発用）
              </p>
              <h1 className="text-lg font-semibold tracking-tight sm:text-xl">
                3案並列比較
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-zinc-600">
                {scene === "theme-settings"
                  ? "色設定（/settings/theme）の3案。スウォッチでトークン一式が変わるか確認。"
                  : scene === "gallery" || scene === "gallery-detail"
                    ? "ギャラリー一覧／詳細の配置比較（検索・チップ・もっと見る・戻るコンテキスト）。"
                    : "UX 補助: 色覚 · 親指ゾーン · 文字サイズ · 低輝度／屋外。本決定はチャットで。"}
              </p>
            </div>
            <p className="shrink-0 text-xs text-zinc-500">
              本番ビルドでは 404 · AI推奨は列に出さない
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="比較する画面"
            >
              <span className="text-xs font-medium text-zinc-600">画面:</span>
              {LAB_SCENES.map((s) => {
                const active = scene === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    aria-pressed={active}
                    title={s.hint}
                    onClick={() => setScene(s.id)}
                    className={
                      active
                        ? "rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                        : "rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    }
                  >
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div
              className="flex flex-wrap items-center gap-2"
              role="group"
              aria-label="端末プレビュー"
            >
              <span className="text-xs font-medium text-zinc-600">表示:</span>
              {LAB_PLATFORMS.map((p) => {
                const active = platform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    aria-pressed={active}
                    title={p.hint}
                    onClick={() => {
                      setPlatform(p.id);
                      if (p.id !== "web-pc") setExpandOpen(false);
                    }}
                    className={
                      active
                        ? "rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                        : "rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                    }
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {platform === "web-pc" ? (
              <button
                type="button"
                onClick={() => openExpand("a")}
                className="rounded-full border border-zinc-900 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-zinc-900 hover:text-white"
              >
                PC 拡大プレビュー
              </button>
            ) : (
              <div
                className="flex flex-wrap items-center gap-2"
                role="group"
                aria-label="スマホの向き"
              >
                <span className="text-xs font-medium text-zinc-600">向き:</span>
                {LAB_PHONE_ORIENTATION_MODES.map((m) => {
                  const active = phoneOrientationMode === m.id;
                  return (
                    <button
                      key={m.id}
                      type="button"
                      aria-pressed={active}
                      title={m.hint}
                      onClick={() => setPhoneOrientationMode(m.id)}
                      className={
                        active
                          ? "rounded-full bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white"
                          : "rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                      }
                    >
                      {m.label}
                    </button>
                  );
                })}
                <span className="text-[11px] text-zinc-500">
                  Web・モバイルとアプリで共通 · 縦+横は同時確認
                </span>
              </div>
            )}
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="UI状態"
          >
            <span className="text-xs font-medium text-zinc-600">状態:</span>
            {LAB_UI_STATES.map((s) => {
              const active = uiState === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setUiState(s.id)}
                  className={
                    active
                      ? "rounded-full bg-zinc-800 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                  }
                >
                  {s.label}
                </button>
              );
            })}
          </div>

          {scene === "home" ? (
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="推し色（全案共通）"
          >
            <span className="text-xs font-medium text-zinc-600">推し色:</span>
            {LAB_OSHI_SWATCHES.map((s, i) => (
              <button
                key={s.cssVar}
                type="button"
                aria-label={s.label}
                aria-pressed={oshiIndex === i}
                title={s.label}
                onClick={() => setOshiIndex(i)}
                className="lab-swatch !h-7 !w-7"
                data-active={oshiIndex === i}
                style={{
                  background: s.hex,
                  boxShadow:
                    oshiIndex === i
                      ? "0 0 0 2px #18181b"
                      : "0 0 0 1px #d4d4d8",
                }}
              />
            ))}
            <span className="text-[11px] text-zinc-500">
              {swatch.label}（ボタン色に即反映）
            </span>
          </div>
          ) : (
            <p className="text-[11px] text-zinc-500">
              色設定シーンでは各案内のスウォッチでトークン一式プレビュー。本番採用はチャットで本決定。
            </p>
          )}

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="色覚プレビュー"
          >
            <span className="text-xs font-medium text-zinc-600">色覚:</span>
            {LAB_CVD_MODES.map((m) => {
              const active = cvdMode === m.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  aria-pressed={active}
                  title={m.hint}
                  onClick={() => setCvdMode(m.id)}
                  className={
                    active
                      ? "rounded-full bg-violet-800 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                  }
                >
                  {m.label}
                </button>
              );
            })}
            <span className="text-[11px] text-zinc-500">
              {cvdMeta?.hint ?? ""} · 近似（診断ではない）· 3列まとめて適用
            </span>
          </div>

          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="UX補助プレビュー"
          >
            <span className="text-xs font-medium text-zinc-600">UX補助:</span>
            <button
              type="button"
              aria-pressed={showThumbZone}
              title={
                isNarrow
                  ? "主CTAが親指の届く帯にあるか"
                  : "Web・モバイル／アプリ表示に切り替えて使う"
              }
              disabled={!isNarrow}
              onClick={() => setShowThumbZone((v) => !v)}
              className={
                showThumbZone && isNarrow
                  ? "rounded-full bg-emerald-800 px-3 py-1 text-xs font-medium text-white"
                  : "rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
              }
            >
              親指ゾーン
            </button>
            <span className="text-xs text-zinc-500">文字:</span>
            {LAB_TEXT_SCALES.map((t) => {
              const active = textScale === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  aria-pressed={active}
                  title={t.hint}
                  onClick={() => setTextScale(t.id)}
                  className={
                    active
                      ? "rounded-full bg-sky-800 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                  }
                >
                  {t.label}
                </button>
              );
            })}
            <span className="text-xs text-zinc-500">環境:</span>
            {LAB_AMBIENTS.map((a) => {
              const active = ambient === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  aria-pressed={active}
                  title={a.hint}
                  onClick={() => setAmbient(a.id)}
                  className={
                    active
                      ? "rounded-full bg-amber-800 px-3 py-1 text-xs font-medium text-white"
                      : "rounded-full border border-zinc-300 bg-white px-3 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
                  }
                >
                  {a.label}
                </button>
              );
            })}
            <span className="w-full text-[11px] text-zinc-500 sm:w-auto">
              {[
                !isNarrow && showThumbZone
                  ? "親指はモバイル表示で"
                  : null,
                textMeta && textMeta.id !== "normal" ? textMeta.hint : null,
                ambientMeta && ambientMeta.id !== "none"
                  ? ambientMeta.hint
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "専門知識なしでも「届く・読める・見える」を確認"}
            </span>
          </div>
        </div>
      </header>

      {tools ? (
        <div className="text-zinc-900">{tools}</div>
      ) : null}

      <div
        className={
          isNarrow
            ? "mx-auto flex max-w-[1600px] flex-wrap justify-center gap-6 p-4"
            : "mx-auto grid max-w-[1600px] gap-4 p-4 lg:grid-cols-3"
        }
        style={previewFilter ? { filter: previewFilter } : undefined}
        data-lab-cvd={cvdMode}
        data-lab-ambient={ambient}
      >
        {LAB_VARIANTS.map((meta) => (
          <section
            key={meta.id}
            data-lab-variant={meta.id}
            className={
              isNarrow
                ? phoneOrientationMode === "portrait"
                  ? "flex w-full max-w-[420px] flex-col"
                  : "flex w-full max-w-[1100px] flex-col"
                : "lab-panel flex min-h-0 flex-col overflow-hidden"
            }
            aria-labelledby={`lab-variant-${meta.id}`}
          >
            <div
              className={
                isNarrow
                  ? "mb-2 px-1"
                  : "border-b border-[var(--lab-border)] px-4 py-3"
              }
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2
                    id={`lab-variant-${meta.id}`}
                    className="text-sm font-semibold tracking-tight text-zinc-900"
                  >
                    {meta.title}
                  </h2>
                  <p className="mt-0.5 text-xs text-zinc-600">{meta.subtitle}</p>
                </div>
                {platform === "web-pc" ? (
                  <button
                    type="button"
                    onClick={() => openExpand(meta.id)}
                    className="shrink-0 rounded border border-zinc-300 bg-white px-2 py-1 text-[10px] font-medium text-zinc-700 hover:bg-zinc-50"
                    aria-label={`${meta.title}をPC拡大`}
                  >
                    拡大
                  </button>
                ) : null}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-500">
                {meta.ux_focus}
              </p>
            </div>
            <div
              className={
                isNarrow && phoneOrientations.length > 1
                  ? "flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-center"
                  : undefined
              }
            >
              {isNarrow
                ? phoneOrientations.map((orientation) => (
                    <LabDeviceFrame
                      key={orientation}
                      platform={platform}
                      orientation={orientation}
                      showThumbZone={showThumbZone && isNarrow}
                      textScale={textScale}
                    >
                      <div className="lab-panel border-0 p-4 shadow-none">
                        <LabMockSurface
                          variant={meta.id}
                          platform={platform}
                          uiState={uiState}
                          scene={scene}
                          oshiIndex={oshiIndex}
                          onOshiIndexChange={setOshiIndex}
                        />
                      </div>
                    </LabDeviceFrame>
                  ))
                : (
                    <LabDeviceFrame
                      platform={platform}
                      showThumbZone={false}
                      textScale={textScale}
                    >
                      <div className="flex-1 p-4">
                        <LabMockSurface
                          variant={meta.id}
                          platform={platform}
                          uiState={uiState}
                          scene={scene}
                          oshiIndex={oshiIndex}
                          onOshiIndexChange={setOshiIndex}
                        />
                      </div>
                    </LabDeviceFrame>
                  )}
            </div>
          </section>
        ))}
      </div>

      <LabPcExpandPreview
        open={expandOpen}
        onClose={() => setExpandOpen(false)}
        initialVariant={expandVariant}
        uiState={uiState}
        scene={scene}
        oshiIndex={oshiIndex}
        onOshiIndexChange={setOshiIndex}
        cvdMode={cvdMode}
        ambient={ambient}
        textScale={textScale}
      />
    </div>
  );
}
