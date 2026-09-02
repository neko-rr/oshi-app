/**
 * applyAssistToDraft 優先順位のユニットテスト。
 * 実行: node --experimental-strip-types --test apps/web/src/components/register/assist/applyAssistToDraft.test.ts
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { applyAssistToDraft } from "./applyAssistToDraft.ts";
import { emptyFieldSources, type AssistDraftSlice, type VisionStructured } from "./types.ts";

function baseDraft(partial: Partial<AssistDraftSlice> = {}): AssistDraftSlice {
  return {
    product_name: "",
    purchase_price: "",
    character_name: "",
    product_group_name: "",
    memo: "",
    category_tag_id: null,
    selected_slots: [],
    visual_tags: [],
    unmatched_product_type: null,
    ...partial,
  };
}

const categories = [
  { category_tag_id: 10, category_tag_name: "缶バッジ" },
  { category_tag_id: 11, category_tag_name: "アクリル" },
];

const colorOptions = [
  { slot: 1, color_tag_name: "赤" },
  { slot: 2, color_tag_name: "青" },
  { slot: 7, color_tag_name: "ピンク" },
];

const visionFull: VisionStructured = {
  description: "Vision説明",
  product_type: "缶バッジ",
  product_name: "Vision商品名",
  character_name: "Visionキャラ",
  product_group_name: "Visionグループ",
  colors: ["ピンク", "赤"],
  visual_tags: ["キラキラ", "パステル", "アイドル系"],
};

describe("applyAssistToDraft", () => {
  it("バーコード由来の product_name は Vision で上書きしない", () => {
    const sources = emptyFieldSources();
    sources.product_name = "barcode";
    const { draft } = applyAssistToDraft(
      visionFull,
      baseDraft({ product_name: "楽天の商品名", purchase_price: "1200" }),
      sources,
      categories,
      colorOptions,
    );
    assert.equal(draft.product_name, "楽天の商品名");
    assert.equal(draft.category_tag_id, 10);
    assert.deepEqual(draft.selected_slots, [1, 7]);
    assert.deepEqual(draft.visual_tags, ["キラキラ", "パステル", "アイドル系"]);
  });

  it("手入力の種類は Vision で上書きしない", () => {
    const sources = emptyFieldSources();
    sources.category_tag_id = "user";
    const { draft } = applyAssistToDraft(
      visionFull,
      baseDraft({ category_tag_id: 11 }),
      sources,
      categories,
      colorOptions,
    );
    assert.equal(draft.category_tag_id, 11);
  });

  it("空欄なら Vision が名前・種類・色を埋める", () => {
    const { draft, sources } = applyAssistToDraft(
      visionFull,
      baseDraft(),
      emptyFieldSources(),
      categories,
      colorOptions,
    );
    assert.equal(draft.product_name, "Vision商品名");
    assert.equal(draft.category_tag_id, 10);
    assert.equal(sources.product_name, "vision");
    assert.equal(sources.category_tag_id, "vision");
    assert.equal(draft.memo, "Vision説明");
  });

  it("未知の product_type は unmatched に残す", () => {
    const vision = { ...visionFull, product_type: "ぬいぐるみ特大" };
    const { draft } = applyAssistToDraft(
      vision,
      baseDraft(),
      emptyFieldSources(),
      categories,
      colorOptions,
    );
    assert.equal(draft.category_tag_id, null);
    assert.equal(draft.unmatched_product_type, "ぬいぐるみ特大");
  });

  it("ユーザー色選択後は Vision 色をマージしない", () => {
    const sources = emptyFieldSources();
    sources.color_tag_slots = "user";
    const { draft } = applyAssistToDraft(
      visionFull,
      baseDraft({ selected_slots: [2] }),
      sources,
      categories,
      colorOptions,
    );
    assert.deepEqual(draft.selected_slots, [2]);
  });
});
