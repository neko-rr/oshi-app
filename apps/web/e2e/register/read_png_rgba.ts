/**
 * 8bit RGB/RGBA・非インターレース PNG だけ読む（L1 用。依存追加なし）。
 */

import { inflateSync } from "node:zlib";

export type PngRgba = {
  width: number;
  height: number;
  data: Uint8Array;
};

function paeth(a: number, b: number, c: number): number {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
}

export function readPngRgba(pngBytes: Buffer): PngRgba {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  if (pngBytes.length < 16 || !pngBytes.subarray(0, 8).equals(sig)) {
    throw new Error("PNG シグネチャが不正です");
  }
  let offset = 8;
  let width = 0;
  let height = 0;
  let bitDepth = 0;
  let colorType = 0;
  const idat: Buffer[] = [];
  while (offset + 8 <= pngBytes.length) {
    const len = pngBytes.readUInt32BE(offset);
    const type = pngBytes.subarray(offset + 4, offset + 8).toString("ascii");
    const data = pngBytes.subarray(offset + 8, offset + 8 + len);
    offset += 12 + len;
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8] ?? 0;
      colorType = data[9] ?? 0;
    } else if (type === "IDAT") {
      idat.push(Buffer.from(data));
    } else if (type === "IEND") {
      break;
    }
  }
  if (bitDepth !== 8 || (colorType !== 2 && colorType !== 6)) {
    throw new Error("未対応の PNG（8bit RGB/RGBA のみ）");
  }
  if (width < 1 || height < 1) {
    throw new Error("PNG サイズが不正です");
  }
  const bpp = colorType === 6 ? 4 : 3;
  const inflated = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const raw = new Uint8Array(width * height * 4);
  let src = 0;
  let prev = new Uint8Array(stride);
  for (let y = 0; y < height; y += 1) {
    const filter = inflated[src] ?? 0;
    src += 1;
    const row = inflated.subarray(src, src + stride);
    src += stride;
    const recon = new Uint8Array(stride);
    for (let i = 0; i < stride; i += 1) {
      const x = row[i] ?? 0;
      const a = i >= bpp ? (recon[i - bpp] ?? 0) : 0;
      const b = prev[i] ?? 0;
      const c = i >= bpp ? (prev[i - bpp] ?? 0) : 0;
      let val = x;
      if (filter === 1) val = (x + a) & 255;
      else if (filter === 2) val = (x + b) & 255;
      else if (filter === 3) val = (x + Math.floor((a + b) / 2)) & 255;
      else if (filter === 4) val = (x + paeth(a, b, c)) & 255;
      else if (filter !== 0) {
        throw new Error(`未対応の PNG フィルタ: ${filter}`);
      }
      recon[i] = val;
    }
    for (let x = 0; x < width; x += 1) {
      const si = x * bpp;
      const di = (y * width + x) * 4;
      raw[di] = recon[si] ?? 0;
      raw[di + 1] = recon[si + 1] ?? 0;
      raw[di + 2] = recon[si + 2] ?? 0;
      raw[di + 3] = bpp === 4 ? (recon[si + 3] ?? 255) : 255;
    }
    prev = recon;
  }
  return { width, height, data: raw };
}
