"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import {
  API_PATHS,
  type CreatePhotoResponse,
  type CreateProductResponse,
} from "@oshi/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";

type ColorTagItem = {
  slot: number;
  color_tag_name: string;
  color_tag_color: string;
};

type BarcodeLookupResponse = {
  status?: string;
  items?: Array<{ name?: string | null; price?: number | null }>;
  message?: string;
};

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

export function RegisterForm() {
  const router = useRouter();
  const [productName, setProductName] = useState("");
  const [productGroupName, setProductGroupName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [barcode, setBarcode] = useState("");
  const [memo, setMemo] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [colors, setColors] = useState<ColorTagItem[]>([]);
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [barcodeNote, setBarcodeNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [note] = useState(
    "IO Vision 連携はこの画面では使いません（キー未更新時は接続しません）。",
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const supabase = createClient();
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !data.session || cancelled) return;
        const res = await fetch(`${apiBase()}${API_PATHS.colorTags}`, {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
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

  function toggleSlot(slot: number) {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }

  async function onBarcodeBlur() {
    const code = barcode.trim();
    if (!code) {
      setBarcodeNote(null);
      return;
    }
    setBarcodeNote(null);
    try {
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) return;
      const res = await fetch(
        `${apiBase()}${API_PATHS.assistBarcodeLookup}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ barcode: code }),
        },
      );
      if (!res.ok) return;
      const json = (await res.json()) as BarcodeLookupResponse;
      const status = json.status ?? "";
      if (status === "live_disabled" || status === "missing_credentials") {
        return;
      }
      if (status === "success" && json.items && json.items.length > 0) {
        const first = json.items[0];
        if (first?.name && !productName.trim()) {
          setProductName(String(first.name));
        }
        if (
          first?.price != null &&
          Number.isFinite(Number(first.price)) &&
          !purchasePrice.trim()
        ) {
          setPurchasePrice(String(first.price));
        }
        setBarcodeNote(`候補 ${json.items.length} 件を取得しました`);
        return;
      }
      if (json.message) {
        setBarcodeNote(json.message);
      }
    } catch {
      // ソフト失敗は登録を止めない
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !data.session) {
        router.push("/auth/login");
        return;
      }
      const token = data.session.access_token;
      let photoId: number | null = null;

      if (file) {
        const form = new FormData();
        form.append("file", file);
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

      const priceNum = purchasePrice.trim()
        ? Number(purchasePrice.trim())
        : null;
      const slots = Array.from(selectedSlots).sort((a, b) => a - b);

      const productRes = await fetch(`${apiBase()}${API_PATHS.products}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_name: productName,
          barcode_number: barcode || null,
          memo: memo || null,
          photo_id: photoId,
          product_group_name: productGroupName.trim() || null,
          character_name: characterName.trim() || null,
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
      router.push(
        `/gallery?registered=${created.registered_product_id}`,
      );
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "登録に失敗しました");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <p className="text-sm text-muted-foreground">{note}</p>

      <div className="grid gap-2">
        <Label htmlFor="product_name">製品名（必須）</Label>
        <Input
          id="product_name"
          required
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="product_group_name">グループ名（任意）</Label>
        <Input
          id="product_group_name"
          value={productGroupName}
          onChange={(e) => setProductGroupName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="character_name">キャラクター名（任意）</Label>
        <Input
          id="character_name"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="purchase_price">購入価格（任意）</Label>
        <Input
          id="purchase_price"
          type="number"
          inputMode="numeric"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="barcode">バーコード（任意）</Label>
        <Input
          id="barcode"
          value={barcode}
          onChange={(e) => setBarcode(e.target.value)}
          onBlur={() => void onBarcodeBlur()}
          placeholder="フォーカス外で楽天検索"
        />
        {barcodeNote ? (
          <p className="text-xs text-muted-foreground">{barcodeNote}</p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="photo">正面写真（任意）</Label>
        <Input
          id="photo"
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="memo">メモ</Label>
        <Input
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      {colors.length > 0 ? (
        <fieldset className="grid gap-2">
          <legend className="text-sm font-medium">カラータグ（任意）</legend>
          <div className="flex flex-col gap-2">
            {colors.map((c) => (
              <label key={c.slot} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selectedSlots.has(c.slot)}
                  onChange={() => toggleSlot(c.slot)}
                />
                <span
                  className="inline-block h-3 w-3 rounded border border-border"
                  style={{ backgroundColor: c.color_tag_color }}
                  aria-hidden
                />
                {c.color_tag_name}（{c.slot}）
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={loading}>
          {loading ? "保存中…" : "登録する"}
        </Button>
        <Button asChild type="button" variant="outline">
          <Link href="/gallery">ギャラリーへ</Link>
        </Button>
      </div>
    </form>
  );
}
