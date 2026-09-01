"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Props = {
  fileName: string | null;
  onFileChange: (file: File | null) => void;
  onNext: () => void;
  onSkip: () => void;
  onBack: () => void;
};

export function StepPhoto({
  fileName,
  onFileChange,
  onNext,
  onSkip,
  onBack,
}: Props) {
  return (
    <div className="flex max-w-md flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">手順 2 — 正面写真</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          スマホではカメラが開きます。PC ではファイル選択もできます。なくても登録できます。
        </p>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="wizard_photo">正面写真（撮影またはアップロード）</Label>
        <Input
          id="wizard_photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
        />
        {fileName ? (
          <p className="text-xs text-muted-foreground">選択中: {fileName}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={onNext}>
          次へ
        </Button>
        <Button type="button" variant="secondary" onClick={onSkip}>
          スキップ
        </Button>
        <Button type="button" variant="outline" onClick={onBack}>
          戻る
        </Button>
      </div>
    </div>
  );
}
