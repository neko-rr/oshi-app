/** 登録アシストの型（snake_case ワイヤに合わせる） */

export type FieldSource = "user" | "barcode" | "vision" | "empty";

export type FieldSources = {
  product_name: FieldSource;
  purchase_price: FieldSource;
  character_name: FieldSource;
  product_group_name: FieldSource;
  memo: FieldSource;
  category_tag_id: FieldSource;
  color_tag_slots: FieldSource;
};

export type VisionStructured = {
  description: string | null;
  product_type: string | null;
  product_name: string | null;
  character_name: string | null;
  product_group_name: string | null;
  colors: string[];
  visual_tags: string[];
};

export type CategoryOption = {
  category_tag_id: number;
  category_tag_name: string;
};

export type ColorOption = {
  slot: number;
  color_tag_name: string;
};

export type AssistDraftSlice = {
  product_name: string;
  purchase_price: string;
  character_name: string;
  product_group_name: string;
  memo: string;
  category_tag_id: number | null;
  selected_slots: number[];
  visual_tags: string[];
  unmatched_product_type: string | null;
};

export function emptyFieldSources(): FieldSources {
  return {
    product_name: "empty",
    purchase_price: "empty",
    character_name: "empty",
    product_group_name: "empty",
    memo: "empty",
    category_tag_id: "empty",
    color_tag_slots: "empty",
  };
}
