"use client";

import Link from "next/link";
import { FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ColorTagItem } from "./types";

type Props = {
  productName: string;
  productGroupName: string;
  characterName: string;
  purchasePrice: string;
  barcode: string;
  memo: string;
  colors: ColorTagItem[];
  selectedSlots: Set<number>;
  assistHint: string | null;
  error: string | null;
  loading: boolean;
  onProductName: (v: string) => void;
  onProductGroupName: (v: string) => void;
  onCharacterName: (v: string) => void;
  onPurchasePrice: (v: string) => void;
  onBarcode: (v: string) => void;
  onMemo: (v: string) => void;
  onToggleSlot: (slot: number) => void;
  onBack: () => void;
  onSubmit: (e: FormEvent) => void;
};

export function StepConfirm({
  productName,
  productGroupName,
  characterName,
  purchasePrice,
  barcode,
  memo,
  colors,
  selectedSlots,
  assistHint,
  error,
  loading,
  onProductName,
  onProductGroupName,
  onCharacterName,
  onPurchasePrice,
  onBarcode,
  onMemo,
  onToggleSlot,
  onBack,
  onSubmit,
}: Props) {
  return (
    <form onSubmit={onSubmit} className="flex max-w-md flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">手順 6 — 確認と本登録</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          内容を確認・修正して登録します。外部アシストがなくても保存できます。
        </p>
        {assistHint ? (
          <p className="mt-2 text-xs text-muted-foreground" role="status">
            {assistHint}
          </p>
        ) : null}
      </div>

      <div className="grid gap-2">
        <Label htmlFor="product_name">製品名（必須）</Label>
        <Input
          id="product_name"
          required
          value={productName}
          onChange={(e) => onProductName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="product_group_name">グループ名（任意）</Label>
        <Input
          id="product_group_name"
          value={productGroupName}
          onChange={(e) => onProductGroupName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="character_name">キャラクター名（任意）</Label>
        <Input
          id="character_name"
          value={characterName}
          onChange={(e) => onCharacterName(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="purchase_price">購入価格（任意）</Label>
        <Input
          id="purchase_price"
          type="number"
          inputMode="numeric"
          value={purchasePrice}
          onChange={(e) => onPurchasePrice(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="barcode">バーコード（任意）</Label>
        <Input
          id="barcode"
          value={barcode}
          onChange={(e) => onBarcode(e.target.value)}
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="memo">メモ</Label>
        <Input
          id="memo"
          value={memo}
          onChange={(e) => onMemo(e.target.value)}
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
                  onChange={() => onToggleSlot(c.slot)}
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
        <Button type="button" variant="outline" onClick={onBack}>
          戻る
        </Button>
        <Button asChild type="button" variant="ghost">
          <Link href="/gallery">ギャラリーへ</Link>
        </Button>
      </div>
    </form>
  );
}
