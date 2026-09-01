"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  detectFromImageFile,
  detectFromVideoFrame,
  isNativeBarcodeDetectorAvailable,
} from "@/lib/barcode/detect";
import type { DecodedBarcode } from "@/lib/barcode/formats";

type Props = {
  /** 読取成功（カメラは停止済み） */
  onDetected: (decoded: DecodedBarcode) => void;
  disabled?: boolean;
};

/**
 * ライブ読取 + 画像アップロード。
 * 将来の「購入済み判定」画面からも同じコンポーネントを使う前提。
 */
export function BarcodeScanner({ onDetected, disabled }: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);
  const [active, setActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engineNote, setEngineNote] = useState<string | null>(null);

  async function stopCamera() {
    scanningRef.current = false;
    const stream = streamRef.current;
    streamRef.current = null;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    const video = videoRef.current;
    if (video) {
      video.srcObject = null;
    }
    setActive(false);
  }

  useEffect(() => {
    return () => {
      void stopCamera();
    };
  }, []);

  async function startCamera() {
    if (disabled) return;
    setError(null);
    setEngineNote(
      isNativeBarcodeDetectorAvailable()
        ? "ネイティブ読取を使用します"
        : "互換モード（ZXing）で読取します",
    );
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("このブラウザではカメラを使えません。番号入力か画像を使ってください。");
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      video.srcObject = stream;
      await video.play();
      setActive(true);
      scanningRef.current = true;
      void scanLoop();
    } catch {
      setError(
        "カメラを開始できませんでした。権限を許可するか、番号入力・画像を使ってください。",
      );
      await stopCamera();
    }
  }

  async function scanLoop() {
    while (scanningRef.current) {
      const video = videoRef.current;
      if (video) {
        const decoded = await detectFromVideoFrame(video);
        if (decoded && scanningRef.current) {
          scanningRef.current = false;
          await stopCamera();
          onDetected(decoded);
          return;
        }
      }
      await sleep(250);
    }
  }

  async function onUploadChange(file: File | null) {
    if (!file || disabled) return;
    setError(null);
    await stopCamera();
    const decoded = await detectFromImageFile(file);
    if (!decoded) {
      setError("画像からバーコードを読めませんでした。別の画像か番号入力を試してください。");
      return;
    }
    onDetected(decoded);
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-md border border-border bg-muted">
        <video
          ref={videoRef}
          className="aspect-video w-full object-cover"
          playsInline
          muted
          autoPlay
        />
      </div>

      {engineNote ? (
        <p className="text-xs text-muted-foreground">{engineNote}</p>
      ) : null}
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {!active ? (
          <Button
            type="button"
            disabled={disabled}
            onClick={() => void startCamera()}
          >
            カメラで読取
          </Button>
        ) : (
          <Button
            type="button"
            variant="secondary"
            onClick={() => void stopCamera()}
          >
            カメラを止める
          </Button>
        )}
      </div>

      <div className="grid gap-1">
        <Label htmlFor="barcode_image_upload">バーコード画像をアップロード</Label>
        <Input
          id="barcode_image_upload"
          type="file"
          accept="image/*"
          capture="environment"
          disabled={disabled}
          onChange={(e) => void onUploadChange(e.target.files?.[0] ?? null)}
        />
      </div>
    </div>
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
