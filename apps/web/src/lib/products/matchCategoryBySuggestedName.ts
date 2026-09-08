/** genre / 提案名からカテゴリタグを緩くマッチ（完全一致→部分一致） */
export function matchCategoryBySuggestedName(
  suggested: string | null | undefined,
  categories: Array<{ category_tag_id: number; category_tag_name: string }>,
): number | null {
  const name = (suggested || "").trim().toLowerCase();
  if (!name || categories.length === 0) return null;
  const exact = categories.find(
    (c) => c.category_tag_name.trim().toLowerCase() === name,
  );
  if (exact) return exact.category_tag_id;
  const partial = categories.find((c) => {
    const cn = c.category_tag_name.trim().toLowerCase();
    return cn.includes(name) || name.includes(cn);
  });
  return partial?.category_tag_id ?? null;
}
