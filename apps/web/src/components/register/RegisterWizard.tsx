"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  API_PATHS,
  type CreatePhotoResponse,
  type CreateProductResponse,
} from "@oshi/shared";
import { createClient } from "@/lib/client";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { findResidenceRegion } from "@/lib/residencePrefs";
import { orderStorageLocationsForRegister } from "@/lib/registerPrefs";
import type { DecodedBarcode } from "@/lib/barcode/formats";
import { findOwnedProductsByBarcode } from "@/lib/products/findOwnedByBarcode";
import { Button } from "@/components/ui/button";
import {
  applyAssistToDraft,
  matchCategoryId,
} from "./assist/applyAssistToDraft";
import { runAssistPipeline } from "./assist/runAssistPipeline";
import type { AssistDraftSlice, FieldSources } from "./assist/types";
import {
  assistStatusDescriptor,
  resolveAssistMessage,
} from "./assistMessages";
import {
  StepBarcode,
  type OwnedProductHint,
} from "./StepBarcode";
import { StepConfirm } from "./StepConfirm";
import { StepPhoto } from "./StepPhoto";
import {
  emptyDraft,
  type BarcodeLookupResponse,
  type CategoryTagItem,
  type ColorTagItem,
  type RegisterDraft,
  type StorageLocationItem,
  type WizardStep,
} from "./types";

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

async function getAccessToken(): Promise<string | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;
  return data.session.access_token;
}

function toAssistSlice(draft: RegisterDraft): AssistDraftSlice {
  return {
    product_name: draft.productName,
    purchase_price: draft.purchasePrice,
    character_name: draft.characterName,
    product_group_name: draft.productGroupName,
    memo: draft.memo,
    category_tag_id: draft.categoryTagId,
    selected_slots: Array.from(draft.selectedSlots),
    visual_tags: draft.visualTags,
    unmatched_product_type: draft.unmatchedProductType,
  };
}

function markUserSource(
  prev: FieldSources,
  key: keyof FieldSources,
): FieldSources {
  return { ...prev, [key]: "user" };
}

export function RegisterWizard() {
  const router = useRouter();
  const t = useTranslations("Register");
  const tAssist = useTranslations("Register.assist");
  const tBarcode = useTranslations("Register.barcode");
  const tConfirm = useTranslations("Register.confirm");
  const tDefaults = useTranslations("RegisterDefaults");
  const {
    residenceRegion,
    registerStartStep,
    defaultStorageLocationId,
    setRegisterStartStep,
  } = useDisplaySettings();
  const defaultCurrency = findResidenceRegion(residenceRegion).currencyCode;
  const [step, setStep] = useState<WizardStep>(registerStartStep);
  const [draft, setDraft] = useState<RegisterDraft>(() => emptyDraft());
  const [colors, setColors] = useState<ColorTagItem[]>([]);
  const [categories, setCategories] = useState<CategoryTagItem[]>([]);
  const [storageLocationsRaw, setStorageLocationsRaw] = useState<
    StorageLocationItem[]
  >([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [assistHint, setAssistHint] = useState<string | null>(null);
  const [assistPhase, setAssistPhase] = useState<"idle" | "running" | "done">(
    () => (registerStartStep === "confirm" ? "done" : "idle"),
  );
  const [ownedHint, setOwnedHint] = useState<OwnedProductHint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [startNudge, setStartNudge] = useState<"photo" | "confirm" | null>(
    null,
  );
  const assistAbortRef = useRef<AbortController | null>(null);
  const nudgeShownRef = useRef(false);
  const defaultStorageAppliedRef = useRef(false);

  const storageLocations = useMemo(
    () =>
      orderStorageLocationsForRegister(
        storageLocationsRaw,
        defaultStorageLocationId,
      ),
    [storageLocationsRaw, defaultStorageLocationId],
  );

  const formatAssist = useCallback(
    (status: string | undefined, fallback?: string | null) =>
      resolveAssistMessage((key) => tAssist(key), assistStatusDescriptor(status, fallback)),
    [tAssist],
  );

  function maybeOfferStartNudge(next: "photo" | "confirm") {
    if (nudgeShownRef.current) return;
    if (registerStartStep === next) return;
    nudgeShownRef.current = true;
    setStartNudge(next);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token || cancelled) return;
        const headers = { Authorization: `Bearer ${token}` };
        const [colorRes, catRes, storageRes] = await Promise.all([
          fetch(`${apiBase()}${API_PATHS.colorTags}`, { headers }),
          fetch(`${apiBase()}${API_PATHS.categoryTags}`, { headers }),
          fetch(`${apiBase()}${API_PATHS.storageLocations}`, { headers }),
        ]);
        if (cancelled) return;
        if (colorRes.ok) {
          const json = (await colorRes.json()) as { items?: ColorTagItem[] };
          setColors(json.items ?? []);
        }
        if (catRes.ok) {
          const json = (await catRes.json()) as { items?: CategoryTagItem[] };
          setCategories(json.items ?? []);
        }
        if (storageRes.ok) {
          const json = (await storageRes.json()) as {
            items?: StorageLocationItem[];
          };
          setStorageLocationsRaw(json.items ?? []);
        }
      } catch {
        // タグ未取得でも登録自体は続行
      }
    })();
    return () => {
      cancelled = true;
      assistAbortRef.current?.abort();
    };
  }, []);

  // いつも選ぶ収納を初回だけ下書きへ反映
  useEffect(() => {
    if (defaultStorageAppliedRef.current) return;
    if (defaultStorageLocationId == null) return;
    if (
      !storageLocationsRaw.some(
        (s) => s.storage_location_id === defaultStorageLocationId,
      )
    ) {
      return;
    }
    defaultStorageAppliedRef.current = true;
    setDraft((prev) => {
      if (prev.storageLocationId != null) return prev;
      return { ...prev, storageLocationId: defaultStorageLocationId };
    });
  }, [defaultStorageLocationId, storageLocationsRaw]);
  // Vision 後にカテゴリ一覧が届いたら種類名を再マッチ
  useEffect(() => {
    if (categories.length === 0) return;
    setDraft((prev) => {
      if (
        prev.fieldSources.category_tag_id === "user" ||
        prev.categoryTagId != null ||
        !prev.unmatchedProductType
      ) {
        return prev;
      }
      const matchedId = matchCategoryId(
        prev.unmatchedProductType,
        categories.map((c) => ({
          category_tag_id: c.category_tag_id,
          category_tag_name: c.category_tag_name,
        })),
      );
      if (matchedId == null) return prev;
      return {
        ...prev,
        categoryTagId: matchedId,
        unmatchedProductType: null,
        fieldSources: { ...prev.fieldSources, category_tag_id: "vision" },
      };
    });
  }, [categories]);

  function patchDraft(partial: Partial<RegisterDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function toggleSlot(slot: number) {
    setDraft((prev) => {
      const next = new Set(prev.selectedSlots);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return {
        ...prev,
        selectedSlots: next,
        fieldSources: markUserSource(prev.fieldSources, "color_tag_slots"),
      };
    });
  }

  function applyVisualTag(tag: string) {
    setDraft((prev) => {
      const trimmed = tag.trim();
      if (!trimmed) return prev;
      const memo = prev.memo.trim()
        ? prev.memo.includes(trimmed)
          ? prev.memo
          : `${prev.memo} ${trimmed}`
        : trimmed;
      return {
        ...prev,
        memo,
        fieldSources: markUserSource(prev.fieldSources, "memo"),
      };
    });
  }

  async function checkOwned(code: string): Promise<void> {
    const trimmed = code.trim();
    if (!trimmed) {
      setOwnedHint(null);
      return;
    }
    try {
      const token = await getAccessToken();
      if (!token) return;
      const items = await findOwnedProductsByBarcode({
        apiBase: apiBase(),
        accessToken: token,
        barcode: trimmed,
      });
      if (items.length === 0) {
        setOwnedHint(null);
        return;
      }
      const first = items[0];
      setOwnedHint({
        registered_product_id: first.registered_product_id,
        product_name: first.product_name,
      });
    } catch {
      setOwnedHint(null);
    }
  }

  async function lookupBarcode(code: string): Promise<void> {
    const trimmed = code.trim();
    if (!trimmed) {
      patchDraft({ barcodeNote: null });
      return;
    }
    try {
      const token = await getAccessToken();
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const res = await fetch(`${apiBase()}${API_PATHS.assistBarcodeLookup}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ barcode: trimmed }),
      });
      if (!res.ok) {
        patchDraft({
          barcodeNote: tAssist("lookupApiFailed"),
        });
        setAssistHint(tAssist("skipExternalLookup"));
        return;
      }
      const json = (await res.json()) as BarcodeLookupResponse;
      const status = json.status ?? "";
      if (status === "success" && json.items && json.items.length > 0) {
        const first = json.items[0];
        const name = first?.name ? String(first.name) : "";
        const price =
          first?.price != null && Number.isFinite(Number(first.price))
            ? String(first.price)
            : "";
        setDraft((prev) => {
          const sources = { ...prev.fieldSources };
          const nextName =
            prev.fieldSources.product_name === "user"
              ? prev.productName
              : name || prev.productName;
          const nextPrice =
            prev.fieldSources.purchase_price === "user"
              ? prev.purchasePrice
              : price || prev.purchasePrice;
          if (name && prev.fieldSources.product_name !== "user") {
            sources.product_name = "barcode";
          }
          if (price && prev.fieldSources.purchase_price !== "user") {
            sources.purchase_price = "barcode";
          }
          return {
            ...prev,
            barcodeNote: formatAssist(
              status,
              tAssist("successCandidates", { count: json.items!.length }),
            ),
            productName: nextName,
            purchasePrice: nextPrice,
            suggestedName: name,
            suggestedPrice: price,
            fieldSources: sources,
          };
        });
        setAssistHint(null);
        return;
      }
      const msg = formatAssist(status, json.message);
      patchDraft({ barcodeNote: msg });
      setAssistHint(msg);
    } catch {
      patchDraft({
        barcodeNote: tAssist("lookupFailed"),
      });
      setAssistHint(tAssist("externalLookupFailed"));
    }
  }

  async function onDetected(decoded: DecodedBarcode) {
    const code = decoded.raw_value.trim();
    patchDraft({
      barcode: code,
      barcodeType: decoded.format,
      barcodeNote: tBarcode("scannedByCamera"),
    });
    setLookingUp(true);
    try {
      await checkOwned(code);
      await lookupBarcode(code);
    } finally {
      setLookingUp(false);
    }
  }

  async function onLookupAndNext() {
    setLookingUp(true);
    try {
      await checkOwned(draft.barcode);
      await lookupBarcode(draft.barcode);
      setStep("photo");
    } finally {
      setLookingUp(false);
    }
  }

  async function startVisionAssist(file: File | null) {
    assistAbortRef.current?.abort();
    const controller = new AbortController();
    assistAbortRef.current = controller;

    if (!file) {
      setAssistPhase("done");
      if (!draft.barcode.trim()) {
        setAssistHint(tAssist("noTagSuggestions"));
      } else if (draft.barcodeNote) {
        setAssistHint(draft.barcodeNote);
      } else {
        setAssistHint(null);
      }
      return;
    }

    setAssistPhase("running");
    setAssistHint(tAssist("applyingSuggestions"));
    try {
      const token = await getAccessToken();
      if (!token) {
        router.push("/auth/login");
        return;
      }
      const result = await runAssistPipeline({
        apiBase: apiBase(),
        accessToken: token,
        file,
        signal: controller.signal,
      });
      if (result.kind === "aborted") return;
      if (result.kind === "http_error") {
        setAssistHint(tAssist(result.messageKey));
        setAssistPhase("done");
        return;
      }
      if (result.kind === "skipped") {
        setAssistPhase("done");
        return;
      }

      if (result.status !== "success") {
        setAssistHint(formatAssist(result.status, result.message));
        setAssistPhase("done");
        return;
      }

      setDraft((prev) => {
        const merged = applyAssistToDraft(
          result.vision,
          toAssistSlice(prev),
          prev.fieldSources,
          categories.map((c) => ({
            category_tag_id: c.category_tag_id,
            category_tag_name: c.category_tag_name,
          })),
          colors.map((c) => ({
            slot: c.slot,
            color_tag_name: c.color_tag_name,
          })),
        );
        const barcodeProtected =
          prev.fieldSources.product_name === "barcode" ||
          prev.fieldSources.purchase_price === "barcode";
        return {
          ...prev,
          productName: merged.draft.product_name,
          purchasePrice: merged.draft.purchase_price,
          characterName: merged.draft.character_name,
          productGroupName: merged.draft.product_group_name,
          memo: merged.draft.memo,
          categoryTagId: merged.draft.category_tag_id,
          selectedSlots: new Set(merged.draft.selected_slots),
          visualTags: merged.draft.visual_tags,
          unmatchedProductType: merged.draft.unmatched_product_type,
          fieldSources: merged.sources,
          barcodeNote: barcodeProtected
            ? tAssist("barcodeNamePricePriority")
            : prev.barcodeNote,
        };
      });
      const tagCount = result.vision.visual_tags.length;
      setAssistHint(
        tagCount > 0
          ? tAssist("visualTagsSuggested", { count: tagCount })
          : tAssist("visionApplied"),
      );
      setAssistPhase("done");
    } catch {
      setAssistHint(tAssist("visionFailed"));
      setAssistPhase("done");
    }
  }

  function goConfirmFromPhoto(opts?: { clearPhoto?: boolean }) {
    const file = opts?.clearPhoto ? null : draft.file;
    setDraft((prev) => ({
      ...prev,
      file: opts?.clearPhoto ? null : prev.file,
      currencyCode: prev.currencyCode || defaultCurrency,
    }));
    setJustRegistered(false);
    setStep("confirm");
    void startVisionAssist(file);
  }

  function resetForContinue() {
    assistAbortRef.current?.abort();
    setOwnedHint(null);
    setAssistHint(null);
    setAssistPhase(registerStartStep === "confirm" ? "done" : "idle");
    setError(null);
    setJustRegistered(false);
    setStartNudge(null);
    defaultStorageAppliedRef.current = false;
    const next = emptyDraft();
    next.currencyCode = defaultCurrency;
    if (
      defaultStorageLocationId != null &&
      storageLocationsRaw.some(
        (s) => s.storage_location_id === defaultStorageLocationId,
      )
    ) {
      next.storageLocationId = defaultStorageLocationId;
      defaultStorageAppliedRef.current = true;
    }
    setDraft(next);
    // 続けて登録でも設定の開始手順に従う
    setStep(registerStartStep);
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) {
        router.push("/auth/login");
        return;
      }
      let photoId: number | null = null;

      if (draft.file) {
        const form = new FormData();
        form.append("file", draft.file);
        const photoRes = await fetch(`${apiBase()}${API_PATHS.photos}`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        if (!photoRes.ok) {
          const text = await photoRes.text();
          throw new Error(
            tConfirm("photoUploadFailed", { detail: text.slice(0, 160) }),
          );
        }
        const photoJson = (await photoRes.json()) as CreatePhotoResponse;
        photoId = photoJson.photo_id;
      }

      const priceNum = draft.purchasePrice.trim()
        ? Number(draft.purchasePrice.trim())
        : null;
      const hasPrice = priceNum != null && Number.isFinite(priceNum);
      const slots = Array.from(draft.selectedSlots).sort((a, b) => a - b);

      const productRes = await fetch(`${apiBase()}${API_PATHS.products}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_name: draft.productName,
          barcode_number: draft.barcode || null,
          barcode_type: draft.barcodeType || null,
          memo: draft.memo || null,
          photo_id: photoId,
          product_group_name: draft.productGroupName.trim() || null,
          character_name: draft.characterName.trim() || null,
          purchase_price: hasPrice ? Math.trunc(priceNum) : null,
          currency_code: hasPrice
            ? draft.currencyCode || defaultCurrency
            : null,
          color_tag_slots: slots.length > 0 ? slots : null,
          category_tag_id: draft.categoryTagId,
          storage_location_id: draft.storageLocationId,
        }),
      });
      if (!productRes.ok) {
        const text = await productRes.text();
        throw new Error(
          tConfirm("productCreateFailed", { detail: text.slice(0, 160) }),
        );
      }
      const created = (await productRes.json()) as CreateProductResponse;
      setJustRegistered(true);
      setAssistHint(
        tConfirm("registeredSuccess", {
          id: created.registered_product_id,
        }),
      );
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : tConfirm("registerFailed"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ol
        className="flex flex-wrap gap-2 text-xs text-muted-foreground"
        aria-label={t("stepsAria")}
      >
        <li className={step === "barcode" ? "font-semibold text-foreground" : ""}>
          {t("step1")}
          {registerStartStep === "photo" || registerStartStep === "confirm" ? (
            <span className="ml-1 font-normal">({tDefaults("stepSkipped")})</span>
          ) : null}
        </li>
        <li aria-hidden>/</li>
        <li className={step === "photo" ? "font-semibold text-foreground" : ""}>
          {t("step2")}
          {registerStartStep === "confirm" ? (
            <span className="ml-1 font-normal">({tDefaults("stepSkipped")})</span>
          ) : null}
        </li>
        <li aria-hidden>/</li>
        <li className={step === "confirm" ? "font-semibold text-foreground" : ""}>
          {t("step6")}
        </li>
      </ol>

      <p className="text-xs text-muted-foreground">
        <Link
          href="/settings/register"
          className="underline-offset-4 hover:underline"
        >
          {tDefaults("settingsLink")}
        </Link>
      </p>

      {startNudge ? (
        <div
          className="flex flex-col gap-2 rounded-md border border-border bg-muted/40 p-3 text-sm"
          role="status"
        >
          <p>
            {startNudge === "photo"
              ? tDefaults("nudgePhoto")
              : tDefaults("nudgeConfirm")}
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setRegisterStartStep(startNudge);
                setStartNudge(null);
              }}
            >
              {tDefaults("nudgeAccept")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setStartNudge(null)}
            >
              {tDefaults("nudgeDismiss")}
            </Button>
          </div>
        </div>
      ) : null}

      {step === "barcode" ? (
        <StepBarcode
          barcode={draft.barcode}
          note={draft.barcodeNote}
          lookingUp={lookingUp}
          ownedHint={ownedHint}
          onBarcodeChange={(v) => {
            patchDraft({ barcode: v, barcodeType: null });
            setOwnedHint(null);
          }}
          onDetected={(decoded) => void onDetected(decoded)}
          onLookupAndNext={() => void onLookupAndNext()}
          onSkip={() => {
            patchDraft({ barcode: "", barcodeType: null, barcodeNote: null });
            setOwnedHint(null);
            setAssistHint(null);
            setStep("photo");
            maybeOfferStartNudge("photo");
          }}
          onManualAll={() => {
            setOwnedHint(null);
            setAssistHint(tAssist("manualMode"));
            setAssistPhase("done");
            setDraft((prev) => ({
              ...prev,
              currencyCode: prev.currencyCode || defaultCurrency,
            }));
            setStep("confirm");
            maybeOfferStartNudge("confirm");
          }}
        />
      ) : null}

      {step === "photo" ? (
        <StepPhoto
          fileName={draft.file?.name ?? null}
          onFileChange={(file) => patchDraft({ file })}
          onNext={() => goConfirmFromPhoto()}
          onSkip={() => goConfirmFromPhoto({ clearPhoto: true })}
          onBack={() => setStep("barcode")}
        />
      ) : null}

      {step === "confirm" ? (
        <StepConfirm
          productName={draft.productName}
          productGroupName={draft.productGroupName}
          characterName={draft.characterName}
          purchasePrice={draft.purchasePrice}
          currencyCode={draft.currencyCode || defaultCurrency}
          barcode={draft.barcode}
          memo={draft.memo}
          colors={colors}
          categories={categories}
          storageLocations={storageLocations}
          categoryTagId={draft.categoryTagId}
          storageLocationId={draft.storageLocationId}
          selectedSlots={draft.selectedSlots}
          visualTags={draft.visualTags}
          unmatchedProductType={draft.unmatchedProductType}
          assistHint={assistHint}
          assistPhase={assistPhase}
          error={error}
          loading={loading}
          showContinue={justRegistered}
          onProductName={(v) =>
            setDraft((prev) => ({
              ...prev,
              productName: v,
              fieldSources: markUserSource(prev.fieldSources, "product_name"),
            }))
          }
          onProductGroupName={(v) =>
            setDraft((prev) => ({
              ...prev,
              productGroupName: v,
              fieldSources: markUserSource(
                prev.fieldSources,
                "product_group_name",
              ),
            }))
          }
          onCharacterName={(v) =>
            setDraft((prev) => ({
              ...prev,
              characterName: v,
              fieldSources: markUserSource(prev.fieldSources, "character_name"),
            }))
          }
          onPurchasePrice={(v) =>
            setDraft((prev) => ({
              ...prev,
              purchasePrice: v,
              currencyCode: prev.currencyCode || defaultCurrency,
              fieldSources: markUserSource(prev.fieldSources, "purchase_price"),
            }))
          }
          onCurrencyCode={(v) =>
            setDraft((prev) => ({
              ...prev,
              currencyCode: v,
            }))
          }
          onBarcode={(v) => patchDraft({ barcode: v })}
          onMemo={(v) =>
            setDraft((prev) => ({
              ...prev,
              memo: v,
              fieldSources: markUserSource(prev.fieldSources, "memo"),
            }))
          }
          onCategoryTagId={(id) =>
            setDraft((prev) => ({
              ...prev,
              categoryTagId: id,
              unmatchedProductType: null,
              fieldSources: markUserSource(prev.fieldSources, "category_tag_id"),
            }))
          }
          onStorageLocationId={(id) =>
            patchDraft({ storageLocationId: id })
          }
          onToggleSlot={toggleSlot}
          onApplyVisualTag={applyVisualTag}
          onBack={() => {
            assistAbortRef.current?.abort();
            setStep("photo");
          }}
          onSubmit={(e) => void onSubmit(e)}
          onContinueRegister={resetForContinue}
        />
      ) : null}
    </div>
  );
}
