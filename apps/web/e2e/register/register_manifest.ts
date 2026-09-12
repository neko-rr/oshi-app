/**
 * 登録 E2E フィクスチャの manifest 契約。
 * 欠落・スキーマ不正は throw（silent skip 禁止）。
 */

import fs from "node:fs";
import path from "node:path";

const FORBIDDEN_KEYS = [
  "access_token",
  "api_key",
  "secret",
  "password",
  "signed_url",
];

export type RegisterFixtureCase = {
  id: string;
  barcode_image: string;
  expected_barcode: string;
  barcode_format: string;
  front_image: string;
  notes: string;
};

export type RegisterManifest = {
  version: number;
  /** バーコードが無い合成画像（読取失敗用） */
  unreadable_image: string;
  cases: RegisterFixtureCase[];
};

export function registerFixturesDir(): string {
  return path.join(process.cwd(), "e2e", "fixtures", "register");
}

function assertSafeKeys(value: unknown, trail: string): void {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, i) => assertSafeKeys(item, `${trail}[${i}]`));
    return;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const lower = key.toLowerCase();
    if (FORBIDDEN_KEYS.some((bad) => lower.includes(bad))) {
      throw new Error(`manifest に禁止キーがあります: ${trail}.${key}`);
    }
    assertSafeKeys(child, `${trail}.${key}`);
  }
}

export function parseRegisterManifest(raw: unknown): RegisterManifest {
  if (!raw || typeof raw !== "object") {
    throw new Error("manifest がオブジェクトではありません");
  }
  assertSafeKeys(raw, "manifest");
  const obj = raw as Record<string, unknown>;
  if (obj.version !== 1) {
    throw new Error("manifest.version は 1 である必要があります");
  }
  const unreadable_image = String(obj.unreadable_image ?? "").trim();
  if (!unreadable_image.endsWith(".png")) {
    throw new Error("manifest.unreadable_image は .png である必要があります");
  }
  if (!Array.isArray(obj.cases) || obj.cases.length < 1) {
    throw new Error("manifest.cases が空です");
  }
  const cases: RegisterFixtureCase[] = obj.cases.map((item, index) => {
    if (!item || typeof item !== "object") {
      throw new Error(`cases[${index}] が不正です`);
    }
    const row = item as Record<string, unknown>;
    const id = String(row.id ?? "").trim();
    const barcode_image = String(row.barcode_image ?? "").trim();
    const expected_barcode = String(row.expected_barcode ?? "").trim();
    const barcode_format = String(row.barcode_format ?? "").trim();
    const front_image = String(row.front_image ?? "").trim();
    const notes = String(row.notes ?? "").trim();
    if (!id || !barcode_image || !expected_barcode || !front_image) {
      throw new Error(`cases[${index}] の必須欄が欠けています`);
    }
    if (barcode_image === front_image || barcode_image === unreadable_image) {
      throw new Error(
        `cases[${index}]: barcode / 正面 / 読めない画像は別ファイルである必要があります`,
      );
    }
    if (!barcode_image.endsWith(".png") || !front_image.endsWith(".png")) {
      throw new Error(`cases[${index}]: 画像は .png のみです`);
    }
    return {
      id,
      barcode_image,
      expected_barcode,
      barcode_format,
      front_image,
      notes,
    };
  });
  return { version: 1, unreadable_image, cases };
}

export function assertPngFile(filePath: string): void {
  if (!fs.existsSync(filePath)) {
    throw new Error(`フィクスチャがありません: ${path.basename(filePath)}`);
  }
  const fd = fs.openSync(filePath, "r");
  try {
    const header = Buffer.alloc(8);
    const n = fs.readSync(fd, header, 0, 8, 0);
    const pngMagic = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    if (n < 8 || !header.equals(pngMagic)) {
      throw new Error(`PNG ではありません: ${path.basename(filePath)}`);
    }
  } finally {
    fs.closeSync(fd);
  }
}

export function loadRegisterManifest(
  dir: string = registerFixturesDir(),
): RegisterManifest {
  const manifestPath = path.join(dir, "manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error("manifest.json がありません");
  }
  const raw = JSON.parse(fs.readFileSync(manifestPath, "utf8")) as unknown;
  const manifest = parseRegisterManifest(raw);
  assertPngFile(path.join(dir, manifest.unreadable_image));
  for (const item of manifest.cases) {
    assertPngFile(path.join(dir, item.barcode_image));
    assertPngFile(path.join(dir, item.front_image));
  }
  return manifest;
}

export function fixtureFile(
  name: string,
  dir: string = registerFixturesDir(),
): string {
  return path.join(dir, name);
}
