/**
 * 合成フィクスチャを生成する（実写は置かない）。
 * 実行: pnpm -C apps/web exec tsx e2e/register/generate_fixtures.ts
 * または: node --experimental-strip-types e2e/register/generate_fixtures.ts
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { deflateSync } from "node:zlib";
import QRCode from "qrcode";

const EXPECTED_BARCODE = "4901234567894";
const DIR = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "fixtures",
  "register",
);

function crc32(buf: Buffer): number {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) {
    crc ^= buf[i] ?? 0;
    for (let j = 0; j < 8; j += 1) {
      const mask = -(crc & 1);
      crc = (crc >>> 1) ^ (0xedb88320 & mask);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

/** 単色 RGB PNG（正面ダミー）。実写・文字は入れない。 */
function solidPng(width: number, height: number, rgb: [number, number, number]): Buffer {
  const [r, g, b] = rgb;
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const row = y * (width * 3 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x += 1) {
      const o = row + 1 + x * 3;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

async function main(): Promise<void> {
  fs.mkdirSync(DIR, { recursive: true });
  const barcodePath = path.join(DIR, "barcode_product_a.png");
  const frontPath = path.join(DIR, "front_product_b.png");
  await QRCode.toFile(barcodePath, EXPECTED_BARCODE, {
    type: "png",
    width: 320,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#FFFFFF" },
  });
  // 製品Bの正面ダミー（青緑）。バーコード画像とは見た目もファイルも別。
  fs.writeFileSync(frontPath, solidPng(128, 128, [32, 120, 160]));
  // バーコードが無い単色（読取失敗用）。QR と混同しないよう赤系。
  fs.writeFileSync(
    path.join(DIR, "unreadable.png"),
    solidPng(128, 128, [180, 40, 40]),
  );
  const manifest = {
    version: 1,
    unreadable_image: "unreadable.png",
    cases: [
      {
        id: "cross_ref_a_b",
        barcode_image: "barcode_product_a.png",
        expected_barcode: EXPECTED_BARCODE,
        barcode_format: "qr_code",
        front_image: "front_product_b.png",
        notes: "barcode=製品A（合成QR） / front=製品B（単色PNG）。参照ずれ検知用",
      },
    ],
  };
  fs.writeFileSync(
    path.join(DIR, "manifest.json"),
    `${JSON.stringify(manifest, null, 2)}\n`,
    "utf8",
  );
  console.log(`wrote fixtures in ${DIR}`);
}

void main();
