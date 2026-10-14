"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { imageInputCapture } from "@/lib/imageSourceInput";

type Props = {
  idPrefix: string;
  fileLabel: string;
  cameraLabel: string;
  onFile: (file: File | null) => void;
  disabled?: boolean;
};

/**
 * ファイル選択とカメラ撮影を別ボタンにする。
 * 同じ input に capture を付けると、アップロードでもカメラが開く。
 */
export function ImageSourcePicker({
  idPrefix,
  fileLabel,
  cameraLabel,
  onFile,
  disabled = false,
}: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const cameraRef = useRef<HTMLInputElement | null>(null);

  function take(input: HTMLInputElement) {
    const file = input.files?.[0] ?? null;
    input.value = "";
    onFile(file);
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={disabled}
        onClick={() => fileRef.current?.click()}
      >
        {fileLabel}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="min-h-11"
        disabled={disabled}
        onClick={() => cameraRef.current?.click()}
      >
        {cameraLabel}
      </Button>
      <input
        ref={fileRef}
        id={`${idPrefix}_file`}
        type="file"
        accept="image/*"
        capture={imageInputCapture("file")}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(event) => take(event.currentTarget)}
      />
      <input
        ref={cameraRef}
        id={`${idPrefix}_camera`}
        type="file"
        accept="image/*"
        capture={imageInputCapture("camera")}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(event) => take(event.currentTarget)}
      />
    </div>
  );
}
