"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import {
  API_PATHS,
  type CreatePhotoResponse,
} from "@oshi/shared";
import { createClient } from "@/lib/client";
import { useDisplaySettings } from "@/hooks/useDisplaySettings";
import { findResidenceRegion } from "@/lib/residencePrefs";
import { orderStorageLocationsForRegister } from "@/lib/registerPrefs";
import type { DecodedBarcode } from "@/lib/barcode/formats";
import { fetchDuplicateHints } from "@/lib/products/fetchDuplicateHints";
import { matchCategoryBySuggestedName } from "@/lib/products/matchCategoryBySuggestedName";
import { isLikelyOfflineError, networkUserMessage } from "@/lib/networkError";
import { useFeedback } from "@/components/feedback/FeedbackProvider";
import { Button } from "@/components/ui/button";
import { applyBarcodeCandidateToDraft } from "./assist/applyBarcodeCandidate";
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
import { buildContinueDraft, clearEventBundle } from "./buildContinueDraft";
import { RegistrationRequiredDialog } from "@/components/auth/RegistrationRequiredDialog";
import { isAnonymousUser } from "@/lib/authGuest";
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

async function getSessionUser(): Promise<{
  accessToken: string;
  isAnonymous: boolean;
} | null> {
  const supabase = createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session?.access_token) return null;
  return {
    accessToken: data.session.access_token,
    isAnonymous: isAnonymousUser(data.session.user),
  };
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
  const tCommon = useTranslations("Common");
  const tDefaults = useTranslations("RegisterDefaults");
  const { flashSuccess } = useFeedback();
  const {
    residenceRegion,
    registerStartStep,
    defaultStorageLocationId,
    setRegisterStartStep,
    keepAtHandCount,
    autoSalesDesired,
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
  const [keywordQuery, setKeywordQuery] = useState("");
  const [keywordLookingUp, setKeywordLookingUp] = useState(false);
  const [assistHint, setAssistHint] = useState<string | null>(null);
  const [assistPhase, setAssistPhase] = useState<"idle" | "running" | "done">(
    () => (registerStartStep === "confirm" ? "done" : "idle"),
  );
  const [ownedHint, setOwnedHint] = useState<OwnedProductHint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorOffline, setErrorOffline] = useState(false);
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const [startNudge, setStartNudge] = useState<"photo" | "confirm" | null>(
    null,
  );
  const [regGate, setRegGate] = useState<
    null | "save" | "photo" | "barcode" | "assist" | "generic"
  >(null);
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

  /** 本登録ユーザーのトークン。ゲストならゲート表示。 */
  async function requirePermanentToken(
    reason: "save" | "photo" | "barcode" | "assist" | "generic",
  ): Promise<string | null> {
    const session = await getSessionUser();
    if (!session) {
      router.push("/auth/login");
      return null;
    }
    if (session.isAnonymous) {
      setRegGate(reason);
      return null;
    }
    return session.accessToken;
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const session = await getSessionUser();
        if (!session || session.isAnonymous || cancelled) return;
        const headers = { Authorization: `Bearer ${session.accessToken}` };
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

  async function checkOwned(
    code: string,
    itemCode?: string | null,
  ): Promise<void> {
    const trimmed = code.trim();
    const item = (itemCode || "").trim();
    if (!trimmed && !item) {
      setOwnedHint(null);
      return;
    }
    try {
      const token = await requirePermanentToken("barcode");
      if (!token) return;
      const hints = await fetchDuplicateHints({
        apiBase: apiBase(),
        accessToken: token,
        barcode: trimmed || null,
        externalItemCode: item || null,
      });
      if (hints.match_count === 0 || !hints.sample) {
        setOwnedHint(null);
        return;
      }
      setOwnedHint({
        registered_product_id: hints.sample.registered_product_id,
        product_name: hints.sample.product_name,
        match_count: hints.match_count,
        total_quantity: hints.total_quantity,
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
      const token = await requirePermanentToken("barcode");
      if (!token) {
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
        const candidates = json.items.slice(0, 5);
        const suggestedCat = json.suggested_category_name ?? null;
        setDraft((prev) => {
          const applied = applyBarcodeCandidateToDraft(candidates[0]!, prev, 0);
          let categoryTagId = prev.categoryTagId;
          let fieldSources = applied.fieldSources;
          if (
            suggestedCat &&
            prev.fieldSources.category_tag_id !== "user" &&
            (categoryTagId == null ||
              prev.fieldSources.category_tag_id === "empty" ||
              prev.fieldSources.category_tag_id === "barcode")
          ) {
            const matched = matchCategoryBySuggestedName(
              suggestedCat,
              categories,
            );
            if (matched != null) {
              categoryTagId = matched;
              fieldSources = {
                ...fieldSources,
                category_tag_id: "barcode",
              };
            }
          }
          return {
            ...prev,
            ...applied,
            categoryTagId,
            fieldSources,
            lookupCandidates: candidates,
            barcodeNote: formatAssist(
              status,
              tAssist("successCandidates", { count: candidates.length }),
            ),
          };
        });
        const itemCode = candidates[0]?.external_item_code ?? null;
        void checkOwned(trimmed, itemCode);
        setAssistHint(null);
        return;
      }
      const msg = formatAssist(status, json.message);
      patchDraft({
        barcodeNote: msg,
        lookupCandidates: [],
        selectedCandidateIndex: null,
      });
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

  async function onKeywordSearch() {
    const kw = keywordQuery.trim();
    if (!kw) return;
    setKeywordLookingUp(true);
    try {
      const token = await requirePermanentToken("assist");
      if (!token) return;
      const res = await fetch(`${apiBase()}${API_PATHS.assistBarcodeKeyword}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ keyword: kw }),
      });
      if (!res.ok) {
        setAssistHint(tConfirm("keywordSearchFailed"));
        return;
      }
      const json = (await res.json()) as BarcodeLookupResponse;
      const status = json.status ?? "";
      if (status === "success" && json.items && json.items.length > 0) {
        const candidates = json.items.slice(0, 5);
        const suggestedCat = json.suggested_category_name ?? null;
        setDraft((prev) => {
          const applied = applyBarcodeCandidateToDraft(candidates[0]!, prev, 0);
          let categoryTagId = prev.categoryTagId;
          let fieldSources = applied.fieldSources;
          if (
            suggestedCat &&
            prev.fieldSources.category_tag_id !== "user" &&
            (categoryTagId == null ||
              prev.fieldSources.category_tag_id === "empty" ||
              prev.fieldSources.category_tag_id === "barcode")
          ) {
            const matched = matchCategoryBySuggestedName(
              suggestedCat,
              categories,
            );
            if (matched != null) {
              categoryTagId = matched;
              fieldSources = {
                ...fieldSources,
                category_tag_id: "barcode",
              };
            }
          }
          return {
            ...prev,
            ...applied,
            categoryTagId,
            fieldSources,
            lookupCandidates: candidates,
          };
        });
        const itemCode = candidates[0]?.external_item_code ?? null;
        void checkOwned(draft.barcode, itemCode);
        setAssistHint(null);
        return;
      }
      setAssistHint(formatAssist(status, json.message));
    } catch {
      setAssistHint(tConfirm("keywordSearchFailed"));
    } finally {
      setKeywordLookingUp(false);
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
      const token = await requirePermanentToken("assist");
      if (!token) {
        setAssistPhase("idle");
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
    setErrorOffline(false);
    setJustRegistered(false);
    setStartNudge(null);
    const next = buildContinueDraft(draft, {
      currencyCode: defaultCurrency,
      defaultStorageLocationId:
        defaultStorageLocationId != null &&
        storageLocationsRaw.some(
          (s) => s.storage_location_id === defaultStorageLocationId,
        )
          ? defaultStorageLocationId
          : null,
    });
    // 既定収納を適用済み扱いにする（確認画面の自動上書きを防ぐ）
    defaultStorageAppliedRef.current =
      next.storageLocationId != null &&
      next.storageLocationId === defaultStorageLocationId;
    setDraft(next);
    setStep(registerStartStep);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function onClearEventBundle() {
    const defaults = {
      currencyCode: defaultCurrency,
      defaultStorageLocationId:
        defaultStorageLocationId != null &&
        storageLocationsRaw.some(
          (s) => s.storage_location_id === defaultStorageLocationId,
        )
          ? defaultStorageLocationId
          : null,
    };
    setDraft((prev) => {
      const next = clearEventBundle(prev, defaults);
      defaultStorageAppliedRef.current =
        next.storageLocationId != null &&
        next.storageLocationId === defaultStorageLocationId;
      return next;
    });
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setErrorOffline(false);
    try {
      const token = await requirePermanentToken("save");
      if (!token) {
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

      let registrationQuantity: number | null = null;
      const qtyRaw = draft.registrationQuantity.trim();
      if (qtyRaw) {
        const q = Number(qtyRaw);
        if (Number.isInteger(q) && q >= 1) registrationQuantity = q;
      }
      const ownedQty = registrationQuantity ?? 1;
      let salesDesired = draft.salesDesired;
      let salesDesiredQuantity: number | null = null;
      const salesQtyRaw = draft.salesDesiredQuantity.trim();
      if (salesQtyRaw) {
        const sq = Number(salesQtyRaw);
        if (Number.isInteger(sq) && sq >= 0) salesDesiredQuantity = sq;
      }
      if (!draft.salesDesiredUserTouched && autoSalesDesired) {
        if (ownedQty > keepAtHandCount) {
          salesDesired = true;
          salesDesiredQuantity = ownedQty - keepAtHandCount;
        }
      }

      const external_refs: Array<Record<string, unknown>> = [];
      const rakutenUrl = draft.rakutenProductUrl.trim();
      const rakutenCode = draft.rakutenItemCode.trim();
      const rakutenShop = draft.rakutenShopName.trim();
      if (rakutenUrl && rakutenCode && rakutenShop) {
        external_refs.push({
          source: "rakuten",
          product_url: rakutenUrl,
          external_item_code: rakutenCode,
          shop_name: rakutenShop,
          is_primary: true,
        });
      }
      const manualUrl = draft.manualProductUrl.trim();
      if (manualUrl) {
        external_refs.push({
          source: "manual",
          product_url: manualUrl,
          label: draft.manualUrlLabel.trim() || null,
          is_primary: external_refs.length === 0,
        });
      }

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
          works_series_name: draft.worksSeriesName.trim() || null,
          title: draft.title.trim() || null,
          character_name: draft.characterName.trim() || null,
          purchase_price: hasPrice ? Math.trunc(priceNum) : null,
          currency_code: hasPrice
            ? draft.currencyCode || defaultCurrency
            : null,
          purchase_location: draft.purchaseLocation.trim() || null,
          purchase_date: draft.purchaseDate.trim() || null,
          registration_quantity: registrationQuantity,
          sales_desired_flag: salesDesired,
          sales_desired_quantity: salesDesired ? salesDesiredQuantity : 0,
          want_object_flag: draft.wantObject,
          sales_desired_user_touched: draft.salesDesiredUserTouched,
          color_tag_slots: slots.length > 0 ? slots : null,
          category_tag_id: draft.categoryTagId,
          storage_location_id: draft.storageLocationId,
          external_refs: external_refs.length > 0 ? external_refs : null,
        }),
      });
      if (!productRes.ok) {
        const text = await productRes.text();
        throw new Error(
          tConfirm("productCreateFailed", { detail: text.slice(0, 160) }),
        );
      }
      await productRes.json();
      setJustRegistered(true);
      setAssistHint(tConfirm("registeredSuccess"));
      flashSuccess(tCommon("registeredFlash"));
    } catch (err: unknown) {
      const offline = isLikelyOfflineError(err);
      setErrorOffline(offline);
      setError(
        networkUserMessage(err, {
          offline: tCommon("offlineHint"),
          fallback: tConfirm("registerFailed"),
        }),
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
          file={draft.file}
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
          worksSeriesName={draft.worksSeriesName}
          title={draft.title}
          characterName={draft.characterName}
          purchasePrice={draft.purchasePrice}
          currencyCode={draft.currencyCode || defaultCurrency}
          purchaseLocation={draft.purchaseLocation}
          purchaseDate={draft.purchaseDate}
          barcode={draft.barcode}
          memo={draft.memo}
          registrationQuantity={draft.registrationQuantity}
          salesDesired={draft.salesDesired}
          salesDesiredQuantity={draft.salesDesiredQuantity}
          wantObject={draft.wantObject}
          photoFile={draft.file}
          colors={colors}
          categories={categories}
          storageLocations={storageLocations}
          categoryTagId={draft.categoryTagId}
          storageLocationId={draft.storageLocationId}
          selectedSlots={draft.selectedSlots}
          visualTags={draft.visualTags}
          unmatchedProductType={draft.unmatchedProductType}
          lookupCandidates={draft.lookupCandidates}
          selectedCandidateIndex={draft.selectedCandidateIndex}
          rakutenProductUrl={draft.rakutenProductUrl}
          rakutenItemCode={draft.rakutenItemCode}
          rakutenShopName={draft.rakutenShopName}
          manualProductUrl={draft.manualProductUrl}
          manualUrlLabel={draft.manualUrlLabel}
          keywordQuery={keywordQuery}
          keywordLookingUp={keywordLookingUp}
          assistHint={assistHint}
          assistPhase={assistPhase}
          error={error}
          errorOffline={errorOffline}
          loading={loading}
          showContinue={justRegistered}
          onRetrySubmit={() => {
            const fake = {
              preventDefault() {},
            } as FormEvent;
            void onSubmit(fake);
          }}
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
          onWorksSeriesName={(v) =>
            setDraft((prev) => ({ ...prev, worksSeriesName: v }))
          }
          onTitle={(v) => setDraft((prev) => ({ ...prev, title: v }))}
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
          onPurchaseLocation={(v) =>
            setDraft((prev) => ({
              ...prev,
              purchaseLocation: v,
              fieldSources: markUserSource(
                prev.fieldSources,
                "purchase_location",
              ),
            }))
          }
          onPurchaseDate={(v) =>
            setDraft((prev) => ({ ...prev, purchaseDate: v }))
          }
          onBarcode={(v) => patchDraft({ barcode: v })}
          onMemo={(v) =>
            setDraft((prev) => ({
              ...prev,
              memo: v,
              fieldSources: markUserSource(prev.fieldSources, "memo"),
            }))
          }
          onRegistrationQuantity={(v) =>
            setDraft((prev) => ({ ...prev, registrationQuantity: v }))
          }
          onSalesDesired={(v) =>
            setDraft((prev) => ({
              ...prev,
              salesDesired: v,
              salesDesiredUserTouched: true,
            }))
          }
          onSalesDesiredQuantity={(v) =>
            setDraft((prev) => ({
              ...prev,
              salesDesiredQuantity: v,
              salesDesiredUserTouched: true,
            }))
          }
          onWantObject={(v) =>
            setDraft((prev) => ({ ...prev, wantObject: v }))
          }
          onSelectCandidate={(index) =>
            setDraft((prev) => {
              const item = prev.lookupCandidates[index];
              if (!item) return prev;
              const applied = applyBarcodeCandidateToDraft(item, prev, index);
              return { ...prev, ...applied };
            })
          }
          onManualProductUrl={(v) =>
            setDraft((prev) => ({
              ...prev,
              manualProductUrl: v,
              fieldSources: markUserSource(prev.fieldSources, "manual_url"),
            }))
          }
          onManualUrlLabel={(v) =>
            setDraft((prev) => ({
              ...prev,
              manualUrlLabel: v,
              fieldSources: markUserSource(prev.fieldSources, "manual_url"),
            }))
          }
          onKeywordQuery={setKeywordQuery}
          onKeywordSearch={() => void onKeywordSearch()}
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
          onClearEventBundle={onClearEventBundle}
          onBack={() => {
            assistAbortRef.current?.abort();
            setStep("photo");
          }}
          onSubmit={(e) => void onSubmit(e)}
          onContinueRegister={resetForContinue}
        />
      ) : null}
      <RegistrationRequiredDialog
        open={regGate != null}
        reason={regGate ?? "generic"}
        onClose={() => setRegGate(null)}
      />
    </div>
  );
}
