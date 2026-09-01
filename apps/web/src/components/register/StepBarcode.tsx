"use client";

import Link from "next/link";
import { BarcodeScanner } from "@/components/barcode/BarcodeScanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { DecodedBarcode } from "@/lib/barcode/formats";

export type OwnedProductHint = {
  registered_product_id: number;
  product_name: string | null;
};

type Props = {
  barcode: string;
  note: string | null;
  lookingUp: boolean;
  ownedHint: OwnedProductHint | null;
  onBarcodeChange: (value: string) => void;
  onDetected: (decoded: DecodedBarcode) => void;
  onLookupAndNext: () => void;
  onSkip: () => void;
  onManualAll: () => void;
};

export function StepBarcode({
  barcode,
  note,
  lookingUp,
  ownedHint,
  onBarcodeChange,
  onDetected,
  onLookupAndNext,
  onSkip,
  onManualAll,
}: Props) {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">手順 1 — バーコード</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          カメラ読取 → 画像 → 番号入力の順。読取結果は購入済みチェックにも使えます。
        </p>
      </div>

      <BarcodeScanner
        disabled={lookingUp}
        onDetected={onDetected}
      />

      <div className="grid gap-2">
        <Label htmlFor="wizard_barcode">バーコード番号</Label>
        <Input
          id="wizard_barcode"
          inputMode="numeric"
          autoComplete="off"
          value={barcode}
          onChange={(e) => onBarcodeChange(e.target.value)}
          placeholder="例: 4901234567890"
        />
        {note ? (
          <p className="text-xs text-muted-foreground" role="status">
            {note}
          </p>
        ) : null}
        {ownedHint ? (
          <p
            className="rounded-md border border-border bg-card px-3 py-2 text-xs text-card-foreground"
            role="status"
          >
            同じバーコードの製品が既にあります:{" "}
            <Link
              href={`/gallery/${ownedHint.registered_product_id}`}
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {ownedHint.product_name?.trim() ||
                `#${ownedHint.registered_product_id}`}
            </Link>
            （続行して追加登録もできます）
          </p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={lookingUp || !barcode.trim()}
          onClick={onLookupAndNext}
        >
          {lookingUp ? "照合中…" : "次へ（照合）"}
        </Button>
        <Button type="button" variant="secondary" onClick={onSkip}>
          スキップ
        </Button>
        <Button type="button" variant="outline" onClick={onManualAll}>
          すべて手動入力
        </Button>
      </div>
    </div>
  );
}
