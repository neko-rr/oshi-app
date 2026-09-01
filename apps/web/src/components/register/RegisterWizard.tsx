"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  API_PATHS,
  type CreatePhotoResponse,
  type CreateProductResponse,
} from "@oshi/shared";
import { createClient } from "@/lib/client";
import type { DecodedBarcode } from "@/lib/barcode/formats";
import { findOwnedProductsByBarcode } from "@/lib/products/findOwnedByBarcode";
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
  type ColorTagItem,
  type RegisterDraft,
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

export function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = useState<WizardStep>("barcode");
  const [draft, setDraft] = useState<RegisterDraft>(() => emptyDraft());
  const [colors, setColors] = useState<ColorTagItem[]>([]);
  const [lookingUp, setLookingUp] = useState(false);
  const [assistHint, setAssistHint] = useState<string | null>(null);
  const [ownedHint, setOwnedHint] = useState<OwnedProductHint | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token || cancelled) return;
        const res = await fetch(`${apiBase()}${API_PATHS.colorTags}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as { items?: ColorTagItem[] };
        if (!cancelled) setColors(json.items ?? []);
      } catch {
        // カラータグ未取得でも登録自体は続行
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function patchDraft(partial: Partial<RegisterDraft>) {
    setDraft((prev) => ({ ...prev, ...partial }));
  }

  function toggleSlot(slot: number) {
    setDraft((prev) => {
      const next = new Set(prev.selectedSlots);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return { ...prev, selectedSlots: next };
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
      // 購入済みチェック失敗は登録を止めない
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
        setDraft((prev) => ({
          ...prev,
          barcodeNote: assistStatusMessage(
            status,
            `候補 ${json.items!.length} 件`,
          ),
          productName: prev.productName.trim() ? prev.productName : name,
          purchasePrice: prev.purchasePrice.trim()
            ? prev.purchasePrice
            : price,
          suggestedName: name,
          suggestedPrice: price,
        }));
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

  function goConfirmFromPhoto(opts?: { clearPhoto?: boolean }) {
    const hasPhoto = opts?.clearPhoto ? false : Boolean(draft.file);
    if (opts?.clearPhoto) {
      patchDraft({ file: null });
    }
    if (!assistHint && draft.barcodeNote) {
      setAssistHint(draft.barcodeNote);
    } else if (!draft.barcode.trim() && !hasPhoto) {
      setAssistHint("バーコード・写真なしのため、タグ提案はありません。");
    } else if (!assistHint) {
      setAssistHint(
        "画像アシストは現在オフ、または未設定です。手入力で続行できます。",
      );
    }
    setStep("confirm");
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
        }),
      });
      if (!productRes.ok) {
        const text = await productRes.text();
        throw new Error(`製品登録失敗: ${text.slice(0, 160)}`);
      }
      const created = (await productRes.json()) as CreateProductResponse;
      router.push(`/gallery?registered=${created.registered_product_id}`);
      router.refresh();
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
          selectedSlots={draft.selectedSlots}
          assistHint={assistHint}
          error={error}
          loading={loading}
          onProductName={(v) => patchDraft({ productName: v })}
          onProductGroupName={(v) => patchDraft({ productGroupName: v })}
          onCharacterName={(v) => patchDraft({ characterName: v })}
          onPurchasePrice={(v) => patchDraft({ purchasePrice: v })}
          onBarcode={(v) => patchDraft({ barcode: v })}
          onMemo={(v) => patchDraft({ memo: v })}
          onToggleSlot={toggleSlot}
          onBack={() => setStep("photo")}
          onSubmit={(e) => void onSubmit(e)}
        />
      ) : null}
    </div>
  );
}
