/** 写真あり時に Vision を1回呼び、structured_data を返す */

import { API_PATHS } from "@oshi/shared";
import type { VisionStructured } from "./types";

export type VisionDescribeResponse = {
  status?: string;
  text?: string | null;
  message?: string | null;
  structured_data?: Partial<VisionStructured> | null;
};

function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === "string" && result.startsWith("data:")) {
        resolve(result);
        return;
      }
      reject(new Error("画像の読み込みに失敗しました"));
    };
    reader.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });
}

function normalizeStructured(
  raw: Partial<VisionStructured> | null | undefined,
  fallbackText: string | null | undefined,
): VisionStructured {
  const description =
    (raw?.description && String(raw.description).trim()) ||
    (fallbackText && String(fallbackText).trim()) ||
    null;
  return {
    description,
    product_type: raw?.product_type ? String(raw.product_type).trim() || null : null,
    product_name: raw?.product_name ? String(raw.product_name).trim() || null : null,
    character_name: raw?.character_name
      ? String(raw.character_name).trim() || null
      : null,
    product_group_name: raw?.product_group_name
      ? String(raw.product_group_name).trim() || null
      : null,
    colors: Array.isArray(raw?.colors)
      ? raw!.colors.map((c) => String(c).trim()).filter(Boolean).slice(0, 12)
      : [],
    visual_tags: Array.isArray(raw?.visual_tags)
      ? raw!.visual_tags.map((t) => String(t).trim()).filter(Boolean).slice(0, 16)
      : [],
  };
}

export type RunAssistPipelineResult =
  | { kind: "skipped"; reason: "no_photo" }
  | { kind: "aborted" }
  | {
      kind: "ok";
      status: string;
      message: string | null;
      vision: VisionStructured;
    }
  | { kind: "http_error"; message: string };

/**
 * 写真があるときだけ POST /assist/vision/describe を1回呼ぶ。
 */
export async function runAssistPipeline(options: {
  apiBase: string;
  accessToken: string;
  file: File | null;
  signal?: AbortSignal;
}): Promise<RunAssistPipelineResult> {
  const { apiBase, accessToken, file, signal } = options;
  if (!file) {
    return { kind: "skipped", reason: "no_photo" };
  }
  if (signal?.aborted) {
    return { kind: "aborted" };
  }

  let imageSource: string;
  try {
    imageSource = await fileToDataUri(file);
  } catch {
    return { kind: "http_error", message: "画像の読み込みに失敗しました。" };
  }
  if (signal?.aborted) {
    return { kind: "aborted" };
  }

  try {
    const res = await fetch(`${apiBase.replace(/\/$/, "")}${API_PATHS.assistVisionDescribe}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image_source: imageSource }),
      signal,
    });
    if (signal?.aborted) {
      return { kind: "aborted" };
    }
    if (!res.ok) {
      return {
        kind: "http_error",
        message: "画像アシストに接続できませんでした。手入力で続行できます。",
      };
    }
    const json = (await res.json()) as VisionDescribeResponse;
    const status = json.status ?? "error";
    return {
      kind: "ok",
      status,
      message: json.message ?? null,
      vision: normalizeStructured(json.structured_data, json.text),
    };
  } catch (err: unknown) {
    if (signal?.aborted || (err instanceof DOMException && err.name === "AbortError")) {
      return { kind: "aborted" };
    }
    return {
      kind: "http_error",
      message: "画像アシストに失敗しました。手入力で続行できます。",
    };
  }
}
