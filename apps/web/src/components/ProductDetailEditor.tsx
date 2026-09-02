"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API_PATHS } from "@oshi/shared";
import { TagChipPicker } from "@/components/tags/TagChipPicker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/client";

type ColorTagItem = {
  slot: number;
  color_tag_name: string;
  color_tag_color: string;
};

type CategoryTagItem = {
  category_tag_id: number;
  category_tag_name: string;
  category_tag_color?: string;
  category_tag_icon?: string;
};

type StorageLocationItem = {
  storage_location_id: number;
  storage_location_name: string;
  storage_location_icon?: string;
};

type ProductDetail = {
  registered_product_id: number;
  product_name: string | null;
  product_group_name?: string | null;
  character_name?: string | null;
  purchase_price?: number | null;
  purchase_location?: string | null;
  barcode_number?: string | null;
  memo?: string | null;
  category_tag_id: number | null;
  storage_location_id: number | null;
  color_tag_slots: number[];
};

function apiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!base) throw new Error("NEXT_PUBLIC_API_BASE_URL が未設定です");
  return base.replace(/\/$/, "");
}

type Props = {
  registeredProductId: number;
  /** 削除後の戻り先（一覧クエリ付き可） */
  galleryHref?: string;
};

export function ProductDetailEditor({
  registeredProductId,
  galleryHref = "/gallery",
}: Props) {
  const router = useRouter();
  const [categories, setCategories] = useState<CategoryTagItem[]>([]);
  const [storageLocations, setStorageLocations] = useState<StorageLocationItem[]>([]);
  const [colors, setColors] = useState<ColorTagItem[]>([]);
  const [productName, setProductName] = useState("");
  const [productGroupName, setProductGroupName] = useState("");
  const [characterName, setCharacterName] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseLocation, setPurchaseLocation] = useState("");
  const [barcodeNumber, setBarcodeNumber] = useState("");
  const [memo, setMemo] = useState("");
  const [categoryTagId, setCategoryTagId] = useState<number | null>(null);
  const [storageLocationId, setStorageLocationId] = useState<number | null>(
    null,
  );
  const [selectedSlots, setSelectedSlots] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const { data, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !data.session) {
      router.push("/auth/login");
      return null;
    }
    return data.session.access_token;
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const headers = { Authorization: `Bearer ${token}` };
        const [catRes, recRes, colRes, detailRes] = await Promise.all([
          fetch(`${apiBase()}${API_PATHS.categoryTags}`, { headers }),
          fetch(`${apiBase()}${API_PATHS.storageLocations}`, { headers }),
          fetch(`${apiBase()}${API_PATHS.colorTags}`, { headers }),
          fetch(
            `${apiBase()}${API_PATHS.products}/${registeredProductId}`,
            { headers },
          ),
        ]);
        if (!catRes.ok || !recRes.ok || !colRes.ok || !detailRes.ok) {
          const bad = [catRes, recRes, colRes, detailRes].find((r) => !r.ok);
          throw new Error(
            `読み込み失敗: ${bad ? (await bad.text()).slice(0, 160) : ""}`,
          );
        }
        const catJson = (await catRes.json()) as { items?: CategoryTagItem[] };
        const recJson = (await recRes.json()) as {
          items?: StorageLocationItem[];
        };
        const colJson = (await colRes.json()) as { items?: ColorTagItem[] };
        const detail = (await detailRes.json()) as ProductDetail;
        if (cancelled) return;
        setCategories(catJson.items ?? []);
        setStorageLocations(recJson.items ?? []);
        setColors(colJson.items ?? []);
        setProductName(detail.product_name?.trim() ?? "");
        setProductGroupName(detail.product_group_name?.trim() ?? "");
        setCharacterName(detail.character_name?.trim() ?? "");
        setPurchasePrice(
          detail.purchase_price != null ? String(detail.purchase_price) : "",
        );
        setPurchaseLocation(detail.purchase_location?.trim() ?? "");
        setBarcodeNumber(detail.barcode_number?.trim() ?? "");
        setMemo(detail.memo ?? "");
        setCategoryTagId(
          detail.category_tag_id != null ? detail.category_tag_id : null,
        );
        setStorageLocationId(
          detail.storage_location_id != null
            ? detail.storage_location_id
            : null,
        );
        setSelectedSlots(new Set(detail.color_tag_slots ?? []));
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "読み込みに失敗しました");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getToken, registeredProductId]);

  function toggleSlot(slot: number) {
    setSelectedSlots((prev) => {
      const next = new Set(prev);
      if (next.has(slot)) next.delete(slot);
      else next.add(slot);
      return next;
    });
  }

  async function onSave(e: FormEvent) {
    e.preventDefault();
    const name = productName.trim();
    if (!name) {
      setError("製品名は必須です");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const priceNum = purchasePrice.trim() ? Number(purchasePrice.trim()) : null;
      const body: Record<string, unknown> = {
        product_name: name,
        product_group_name: productGroupName.trim(),
        character_name: characterName.trim(),
        purchase_location: purchaseLocation.trim(),
        barcode_number: barcodeNumber.trim(),
        memo: memo.trim(),
        purchase_price:
          priceNum != null && Number.isFinite(priceNum)
            ? Math.trunc(priceNum)
            : null,
        color_tag_slots: Array.from(selectedSlots).sort((a, b) => a - b),
      };
      if (categoryTagId != null) {
        body.category_tag_id = categoryTagId;
      } else {
        body.clear_category_tag = true;
      }
      if (storageLocationId != null) {
        body.storage_location_id = storageLocationId;
      } else {
        body.clear_storage_location = true;
      }
      const res = await fetch(
        `${apiBase()}${API_PATHS.products}/${registeredProductId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        throw new Error(`更新失敗: ${(await res.text()).slice(0, 160)}`);
      }
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function onDelete() {
    if (!window.confirm("この製品を削除しますか？")) return;
    setDeleting(true);
    setError(null);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch(
        `${apiBase()}${API_PATHS.products}/${registeredProductId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      if (!res.ok) {
        throw new Error(`削除失敗: ${(await res.text()).slice(0, 160)}`);
      }
      router.push(galleryHref);
      router.refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "削除に失敗しました");
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">編集フォーム読み込み中…</p>;
  }

  return (
    <form
      onSubmit={onSave}
      className="flex max-w-lg flex-col gap-4"
    >
      <h2 className="sr-only">製品情報の編集</h2>

      <div className="grid gap-2">
        <Label htmlFor="detail_product_name">製品名（必須）</Label>
        <Input
          id="detail_product_name"
          required
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_product_group_name">グループ名</Label>
        <Input
          id="detail_product_group_name"
          value={productGroupName}
          onChange={(e) => setProductGroupName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_character_name">キャラクター名</Label>
        <Input
          id="detail_character_name"
          value={characterName}
          onChange={(e) => setCharacterName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_purchase_price">購入価格</Label>
        <Input
          id="detail_purchase_price"
          type="number"
          inputMode="numeric"
          value={purchasePrice}
          onChange={(e) => setPurchasePrice(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_purchase_location">購入場所</Label>
        <Input
          id="detail_purchase_location"
          value={purchaseLocation}
          onChange={(e) => setPurchaseLocation(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_barcode_number">バーコード</Label>
        <Input
          id="detail_barcode_number"
          value={barcodeNumber}
          onChange={(e) => setBarcodeNumber(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="detail_memo">メモ</Label>
        <Input
          id="detail_memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <h3 className="pt-2 text-base font-medium">タグ・収納</h3>

      <TagChipPicker
        label="カテゴリータグ"
        variant="category"
        value={categoryTagId}
        onChange={setCategoryTagId}
        options={categories.map((c) => ({
          id: c.category_tag_id,
          name: c.category_tag_name,
          icon: c.category_tag_icon,
          color: c.category_tag_color,
        }))}
      />

      <TagChipPicker
        label="収納場所"
        variant="storage"
        value={storageLocationId}
        onChange={setStorageLocationId}
        options={storageLocations.map((r) => ({
          id: r.storage_location_id,
          name: r.storage_location_name,
          icon: r.storage_location_icon,
        }))}
      />

      <fieldset className="grid gap-2">
        <legend className="text-sm font-medium">カラータグ</legend>
        {colors.length === 0 ? (
          <p className="text-sm text-muted-foreground">カラータグ未設定</p>
        ) : (
          <div className="flex flex-col gap-2">
            {colors.map((c) => (
              <label
                key={c.slot}
                className="flex items-center gap-2 text-sm"
              >
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
        )}
      </fieldset>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || deleting}>
          {saving ? "保存中…" : "保存する"}
        </Button>
        <Button
          type="button"
          variant="destructive"
          disabled={saving || deleting}
          onClick={() => void onDelete()}
        >
          {deleting ? "削除中…" : "製品を削除"}
        </Button>
      </div>
    </form>
  );
}
