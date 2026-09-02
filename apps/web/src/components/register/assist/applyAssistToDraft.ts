/**
 * Vision 提案を draft にマージする。
 * 優先: 手入力 > バーコード > Vision > 空
 */

import type {
  AssistDraftSlice,
  CategoryOption,
  ColorOption,
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

export function matchColorSlots(
  colors: string[],
  colorOptions: ColorOption[],
): number[] {
  const slots: number[] = [];
  for (const color of colors) {
    for (const opt of colorOptions) {
      if (namesMatch(color, opt.color_tag_name) && !slots.includes(opt.slot)) {
        slots.push(opt.slot);
      }
    }
  }
  return slots.sort((a, b) => a - b);
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
  colorOptions: ColorOption[],
): ApplyAssistResult {
  const nextDraft: AssistDraftSlice = {
    ...draft,
    selected_slots: [...draft.selected_slots],
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

  // 色: user が明示操作していなければ Vision 色をマージ追加
  if (sources.color_tag_slots !== "user") {
    const fromVision = matchColorSlots(vision.colors, colorOptions);
    const merged = new Set(nextDraft.selected_slots);
    for (const slot of fromVision) merged.add(slot);
    nextDraft.selected_slots = Array.from(merged).sort((a, b) => a - b);
    if (fromVision.length > 0) {
      nextSources.color_tag_slots = "vision";
    }
  }

  const tags = vision.visual_tags
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 16);
  nextDraft.visual_tags = tags;

  return { draft: nextDraft, sources: nextSources };
}
