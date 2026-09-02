"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  API_PATHS,
  type CreatePhotoResponse,
  type CreateProductResponse,
} from "@oshi/shared";
import { createClient } from "@/lib/client";
import type { DecodedBarcode } from "@/lib/barcode/formats";
import { findOwnedProductsByBarcode } from "@/lib/products/findOwnedByBarcode";
import {
  applyAssistToDraft,
  matchCategoryId,
} from "./assist/applyAssistToDraft";
import { runAssistPipeline } from "./assist/runAssistPipeline";
import type { AssistDraftSlice, FieldSources } from "./assist/types";
import { assistStatusMessage } from "./assistMessages";
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
  const [step, setStep] = useState<WizardStep>("barcode");
  const [draft, setDraft] = useState<RegisterDraft>(() => emptyDraft());
  const [colors, setColors] = useState<ColorTagItem[]>([]);
  const [categories, setCategories] = useState<CategoryTagItem[]>([]);
  const [storageLocations, setStorageLocations] = useState<
    StorageLocationItem[]
  >([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [assistHint, setAssistHint] = useState<string | null>(null);
  const [assistPhase, setAssistPhase] = useState<"idle" | "running" | "done">(
    "idle",
  );
  const [ownedHint, setOwnedHint] = useState<OwnedProductHint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [justRegistered, setJustRegistered] = useState(false);
  const assistAbortRef = useRef<AbortController | null>(null);

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
          setStorageLocations(json.items ?? []);
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
          barcodeNote: "照合APIに接続できませんでした。手入力で続行できます。",
        });
        setAssistHint("外部照合をスキップして手動登録できます。");
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
            barcodeNote: assistStatusMessage(
              status,
              `候補 ${json.items!.length} 件`,
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
      const msg = assistStatusMessage(status, json.message);
      patchDraft({ barcodeNote: msg });
      setAssistHint(msg);
    } catch {
      patchDraft({
        barcodeNote: "照合に失敗しました。手入力で続行できます。",
      });
      setAssistHint("外部照合に失敗しました。手入力で続行できます。");
    }
  }

  async function onDetected(decoded: DecodedBarcode) {
    const code = decoded.raw_value.trim();
    patchDraft({
      barcode: code,
      barcodeType: decoded.format,
      barcodeNote: "カメラで読み取りました",
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
        setAssistHint("バーコード・写真なしのため、タグ提案はありません。");
      } else if (draft.barcodeNote) {
        setAssistHint(draft.barcodeNote);
      } else {
        setAssistHint(null);
      }
      return;
    }

    setAssistPhase("running");
    setAssistHint("提案を反映中…");
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
        setAssistHint(result.message);
        setAssistPhase("done");
        return;
      }
      if (result.kind === "skipped") {
        setAssistPhase("done");
        return;
      }

      if (result.status !== "success") {
        setAssistHint(assistStatusMessage(result.status, result.message));
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
            ? "バーコードの商品名・価格を優先しています。"
            : prev.barcodeNote,
        };
      });
      const tagCount = result.vision.visual_tags.length;
      setAssistHint(
        tagCount > 0
          ? `見た目タグを ${tagCount} 件提案しました。必要なら修正してください。`
          : "画像アシストを反映しました。必要なら修正してください。",
      );
      setAssistPhase("done");
    } catch {
      setAssistHint("画像アシストに失敗しました。手入力で続行できます。");
      setAssistPhase("done");
    }
  }

  function goConfirmFromPhoto(opts?: { clearPhoto?: boolean }) {
    const file = opts?.clearPhoto ? null : draft.file;
    if (opts?.clearPhoto) {
      patchDraft({ file: null });
    }
    setJustRegistered(false);
    setStep("confirm");
    void startVisionAssist(file);
  }

  function resetForContinue() {
    assistAbortRef.current?.abort();
    setDraft(emptyDraft());
    setOwnedHint(null);
    setAssistHint(null);
    setAssistPhase("idle");
    setError(null);
    setJustRegistered(false);
    setStep("barcode");
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
          throw new Error(`写真アップロード失敗: ${text.slice(0, 160)}`);
        }
        const photoJson = (await photoRes.json()) as CreatePhotoResponse;
        photoId = photoJson.photo_id;
      }

      const priceNum = draft.purchasePrice.trim()
        ? Number(draft.purchasePrice.trim())
        : null;
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
          purchase_price:
            priceNum != null && Number.isFinite(priceNum)
              ? Math.trunc(priceNum)
              : null,
          color_tag_slots: slots.length > 0 ? slots : null,
          category_tag_id: draft.categoryTagId,
          storage_location_id: draft.storageLocationId,
        }),
      });
      if (!productRes.ok) {
        const text = await productRes.text();
        throw new Error(`製品登録失敗: ${text.slice(0, 160)}`);
      }
      const created = (await productRes.json()) as CreateProductResponse;
      setJustRegistered(true);
      setAssistHint(
        `登録しました（ID: ${created.registered_product_id}）。続けて登録するかギャラリーへ進めます。`,
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <ol
        className="flex flex-wrap gap-2 text-xs text-muted-foreground"
        aria-label="登録ステップ"
      >
        <li className={step === "barcode" ? "font-semibold text-foreground" : ""}>
          1. バーコード
        </li>
        <li aria-hidden>/</li>
        <li className={step === "photo" ? "font-semibold text-foreground" : ""}>
          2. 写真
        </li>
        <li aria-hidden>/</li>
        <li className={step === "confirm" ? "font-semibold text-foreground" : ""}>
          6. 確認
        </li>
      </ol>

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
          }}
          onManualAll={() => {
            setOwnedHint(null);
            setAssistHint("すべて手動入力モードです。");
            setAssistPhase("done");
            setStep("confirm");
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
              fieldSources: markUserSource(prev.fieldSources, "purchase_price"),
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
