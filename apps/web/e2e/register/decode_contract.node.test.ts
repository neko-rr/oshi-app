/**
 * L1: manifest 契約 + ZXing で合成バーコードを読む。
 * 実行: node --experimental-strip-types --test e2e/register/decode_contract.node.test.ts
 */

import assert from "node:assert/strict";
import fs from "node:fs";
import { describe, it } from "node:test";
import { decodePngWithZxing } from "./decode_png_zxing.ts";
import {
  fixtureFile,
  loadRegisterManifest,
  parseRegisterManifest,
} from "./register_manifest.ts";

describe("parseRegisterManifest", () => {
  it("空 cases は失敗", () => {
    assert.throws(
      () =>
        parseRegisterManifest({
          version: 1,
          unreadable_image: "unreadable.png",
          cases: [],
        }),
      /空/,
    );
  });

  it("unreadable_image 欠落は失敗", () => {
    assert.throws(
      () =>
        parseRegisterManifest({
          version: 1,
          cases: [
            {
              id: "x",
              barcode_image: "a.png",
              expected_barcode: "1",
              front_image: "b.png",
            },
          ],
        }),
      /unreadable_image/,
    );
  });

  it("禁止キーは失敗", () => {
    assert.throws(
      () =>
        parseRegisterManifest({
          version: 1,
          unreadable_image: "unreadable.png",
          cases: [
            {
              id: "x",
              barcode_image: "a.png",
              expected_barcode: "1",
              front_image: "b.png",
              api_key: "nope",
            },
          ],
        }),
      /禁止キー/,
    );
  });

  it("同一ファイル参照は失敗", () => {
    assert.throws(
      () =>
        parseRegisterManifest({
          version: 1,
          unreadable_image: "unreadable.png",
          cases: [
            {
              id: "x",
              barcode_image: "same.png",
              expected_barcode: "1",
              front_image: "same.png",
            },
          ],
        }),
      /別ファイル/,
    );
  });
});

describe("register fixtures (L1)", () => {
  it("manifest と PNG があり、ZXing が期待バーコードを返す", () => {
    const manifest = loadRegisterManifest();
    const first = manifest.cases[0];
    assert.ok(first);
    const png = fs.readFileSync(fixtureFile(first.barcode_image));
    const decoded = decodePngWithZxing(png);
    assert.equal(decoded, first.expected_barcode);
    assert.notEqual(first.barcode_image, first.front_image);
    assert.ok(manifest.unreadable_image);
    const bad = fs.readFileSync(fixtureFile(manifest.unreadable_image));
    assert.throws(() => decodePngWithZxing(bad), /ZXing|PNG|読め/);
  });
});
