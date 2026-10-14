/**
 * Vision 提案を draft にマージする。
 * 優先: 手入力 > バーコード > Vision > 空
 */

import {
  matchProductColorCodes,
  sortProductColorCodes,
} from "@oshi/shared";
import type {
  AssistDraftSlice,
  CategoryOption,
  FieldSource,
  FieldSources,
  VisionStructured,
} from "./types";

function canOverwrite(source: FieldSource): boolean {
  return source === "empty" || source === "vision";
}

/** 日本語名のゆるい一致（空白除去・小文字化） */
export function namesMatch(a: string, b: string): boolean {
  const na = a.trim().toLowerCase().replace(/\s+/g, "");
  const nb = b.trim().toLowerCase().replace(/\s+/g, "");
  if (!na || !nb) return false;
  return na === nb || na.includes(nb) || nb.includes(na);
}

export function matchCategoryId(
  productType: string | null,
  categories: CategoryOption[],
): number | null {
  if (!productType?.trim()) return null;
  for (const cat of categories) {
    if (namesMatch(productType, cat.category_tag_name)) {
      return cat.category_tag_id;
    }
  }
  return null;
}

export type ApplyAssistResult = {
  draft: AssistDraftSlice;
  sources: FieldSources;
};

/**
 * Vision の structured を draft に適用。barcode/user 出典の列は上書きしない。
 */
export function applyAssistToDraft(
  vision: VisionStructured,
  draft: AssistDraftSlice,
  sources: FieldSources,
  categories: CategoryOption[],
): ApplyAssistResult {
  const nextDraft: AssistDraftSlice = {
    ...draft,
    selected_slots: [...draft.selected_slots],
    product_color_codes: [...draft.product_color_codes],
    visual_tags: [...draft.visual_tags],
  };
  const nextSources: FieldSources = { ...sources };

  if (canOverwrite(sources.product_name) && vision.product_name?.trim()) {
    nextDraft.product_name = vision.product_name.trim();
    nextSources.product_name = "vision";
  }

  if (
    canOverwrite(sources.character_name) &&
    vision.character_name?.trim()
  ) {
    nextDraft.character_name = vision.character_name.trim();
    nextSources.character_name = "vision";
  }

  if (
    canOverwrite(sources.product_group_name) &&
    vision.product_group_name?.trim()
  ) {
    nextDraft.product_group_name = vision.product_group_name.trim();
    nextSources.product_group_name = "vision";
  }

  if (canOverwrite(sources.memo)) {
    const desc = vision.description?.trim();
    if (desc && !nextDraft.memo.trim()) {
      nextDraft.memo = desc;
      nextSources.memo = "vision";
    }
  }

  // 種類: バーコード非対象。user 以外なら Vision でマッチ可能
  if (sources.category_tag_id !== "user") {
    const matched = matchCategoryId(vision.product_type, categories);
    if (matched != null) {
      nextDraft.category_tag_id = matched;
      nextDraft.unmatched_product_type = null;
      nextSources.category_tag_id = "vision";
    } else if (vision.product_type?.trim()) {
      nextDraft.unmatched_product_type = vision.product_type.trim();
    }
  }

  // グッズの色。カラータグ（任意分類）には入れない。
  if (sources.product_color_codes !== "user") {
    const fromVision = matchProductColorCodes(vision.colors);
    if (fromVision.length > 0) {
      nextDraft.product_color_codes = sortProductColorCodes([
        ...nextDraft.product_color_codes,
        ...fromVision,
      ]);
      nextSources.product_color_codes = "vision";
    }
  }

  const tags = vision.visual_tags
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 16);
  nextDraft.visual_tags = tags;

  return { draft: nextDraft, sources: nextSources };
}
