/**
 * galleryEditDraft のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/lib/galleryEditDraft.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ProductEditListItem } from "@oshi/shared";
import {
  draftFromEditItem,
  isEditRowDirty,
  patchBodyFromEditDraft,
} from "./galleryEditDraft.ts";

function sampleItem(): ProductEditListItem {
  return {
    registered_product_id: 4,
    product_name: "缶バッジ",
    photo_id: 8,
    photo_thumbnail_path: "m/t.jpg",
    photo_thumbnail_url: "https://example.test/t.jpg",
    creation_date: null,
    memo: "メモ",
    character_name: "風ねこ",
    category_tag_id: 2,
    storage_location_id: null,
    color_tag_slots: [2, 1],
    external_refs: [
      {
        source: "manual",
        product_url: "https://example.com/item",
        label: "通販",
        is_primary: true,
      },
    ],
  };
}

describe("gallery edit draft", () => {
  it("未変更の行は汚れない", () => {
    const draft = draftFromEditItem(sampleItem());
    assert.equal(isEditRowDirty(draft, draft, false), false);
    assert.equal(draft.color_tag_slots.join(","), "1,2");
    assert.equal(draft.manual_url, "https://example.com/item");
  });

  it("名前の変更と未保存の回転は汚れになる", () => {
    const baseline = draftFromEditItem(sampleItem());
    const renamed = { ...baseline, product_name: "新しい名前" };
    assert.equal(isEditRowDirty(baseline, renamed, false), true);
    assert.equal(isEditRowDirty(baseline, baseline, true), true);
  });

  it("空の製品名は保存ボディにしない", () => {
    const draft = draftFromEditItem(sampleItem());
    const result = patchBodyFromEditDraft(
      { ...draft, product_name: "  " },
      "JPY",
    );
    assert.equal(result.ok, false);
  });

  it("収納なしはクリアフラグになる", () => {
    const draft = draftFromEditItem(sampleItem());
    const result = patchBodyFromEditDraft(draft, "JPY");
    assert.equal(result.ok, true);
    if (!result.ok) return;
    assert.equal(result.body.clear_storage_location, true);
    assert.equal(result.body.category_tag_id, 2);
    assert.deepEqual(result.body.external_refs, [
      {
        source: "manual",
        product_url: "https://example.com/item",
        label: "通販",
        is_primary: true,
      },
    ]);
  });
});
