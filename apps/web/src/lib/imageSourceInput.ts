/** 画像の入り口。ファイルとカメラで capture を分ける。 */

export type ImageSourceKind = "file" | "camera";

/**
 * ファイル選択に capture を付けると、スマホはライブラリを出さずカメラだけ開く。
 * カメラで撮るときだけ背面カメラを指定する。
 */
export function imageInputCapture(
  source: ImageSourceKind,
): "environment" | undefined {
  if (source === "camera") return "environment";
  return undefined;
}
