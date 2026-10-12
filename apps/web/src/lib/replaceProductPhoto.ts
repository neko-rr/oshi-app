/** 詳細の1件差し替え。写真を上げてから photo_id だけ更新する。 */

export type ReplaceProductPhotoResult =
  | { ok: true; photo_id: number }
  | { ok: false; stage: "invalid" | "upload" | "patch" };

export async function replaceProductPhoto(input: {
  photosUrl: string;
  productUrl: string;
  accessToken: string;
  file: File;
  fetchImpl?: typeof fetch;
}): Promise<ReplaceProductPhotoResult> {
  const token = input.accessToken.trim();
  const photosUrl = input.photosUrl.trim();
  const productUrl = input.productUrl.trim();
  if (!token || !photosUrl || !productUrl || !(input.file instanceof File)) {
    return { ok: false, stage: "invalid" };
  }

  const fetchImpl = input.fetchImpl ?? fetch;
  const form = new FormData();
  form.append("file", input.file);
  let photoId = 0;
  try {
    const photoRes = await fetchImpl(photosUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    });
    if (!photoRes.ok) return { ok: false, stage: "upload" };
    const photoJson = (await photoRes.json()) as { photo_id?: unknown };
    if (
      typeof photoJson.photo_id !== "number" ||
      !Number.isInteger(photoJson.photo_id) ||
      photoJson.photo_id < 1
    ) {
      return { ok: false, stage: "upload" };
    }
    photoId = photoJson.photo_id;
  } catch {
    return { ok: false, stage: "upload" };
  }

  try {
    const patchRes = await fetchImpl(productUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ photo_id: photoId }),
    });
    if (!patchRes.ok) return { ok: false, stage: "patch" };
  } catch {
    return { ok: false, stage: "patch" };
  }
  return { ok: true, photo_id: photoId };
}
