/**
 * Lab 文字パック候補。
 * 実行: node --experimental-strip-types --test apps/web/src/components/design-lab/lab-font-pack-candidates.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  LAB_FONT_PACK_CANDIDATES,
  LAB_FONT_PACK_INTENT_GROUPS,
  listLabFontPackCandidates,
} from "./lab-font-pack-candidates.ts";

describe("LAB_FONT_PACK_CANDIDATES", () => {
  it("lists about ten packs including production display sets", () => {
    assert.ok(LAB_FONT_PACK_CANDIDATES.length >= 10);
    const ids = LAB_FONT_PACK_CANDIDATES.map((c) => c.id);
    assert.equal(new Set(ids).size, ids.length);

    const production = LAB_FONT_PACK_CANDIDATES.filter((c) => c.in_production);
    assert.equal(production.length, 6);
    const productionIds = production.map((c) => c.production_id);
    assert.deepEqual(productionIds.sort(), [
      "clean",
      "magazine",
      "notebook",
      "readable",
      "soft",
      "story",
    ]);
    const festival = LAB_FONT_PACK_CANDIDATES.find((c) => c.id === "alt_festival");
    assert.equal(festival?.in_production, false);
    const notebook = LAB_FONT_PACK_CANDIDATES.find((c) => c.id === "prod_notebook");
    assert.equal(notebook?.in_production, true);
    assert.equal(notebook?.name_ja, "手帳・手書き見出し");
  });

  it("gives an OFL reason for every candidate and groups without leftover ids", () => {
    for (const c of LAB_FONT_PACK_CANDIDATES) {
      assert.equal(c.license, "OFL");
      assert.ok(c.reason_ja.length >= 40, c.id);
      assert.ok(c.heading_ja.length > 0);
      assert.ok(c.body_ja.length > 0);
    }
    assert.equal(
      listLabFontPackCandidates().length,
      LAB_FONT_PACK_CANDIDATES.length,
    );
    assert.ok(LAB_FONT_PACK_INTENT_GROUPS.length >= 5);
    const groupedIds = LAB_FONT_PACK_INTENT_GROUPS.flatMap((g) => g.candidate_ids);
    const ids = LAB_FONT_PACK_CANDIDATES.map((c) => c.id);
    assert.equal(new Set(groupedIds).size, ids.length);
  });
});
