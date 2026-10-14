"""グッズの色。ユーザー任意のカラータグとは別の固定分類。複数選択。"""

from __future__ import annotations

from collections import Counter
from typing import Any

# カタログ順。多色は持たない（複数選択で表す）。
PRODUCT_COLOR_CODES: tuple[str, ...] = (
    "white",
    "black",
    "gray",
    "red",
    "pink",
    "orange",
    "yellow",
    "green",
    "blue",
    "light_blue",
    "purple",
    "brown",
    "beige",
    "gold",
    "silver",
)

PRODUCT_COLOR_HEX: dict[str, str] = {
    "white": "#f4f4f5",
    "black": "#18181b",
    "gray": "#a1a1aa",
    "red": "#dc3545",
    "pink": "#ec4899",
    "orange": "#f97316",
    "yellow": "#eab308",
    "green": "#22c55e",
    "blue": "#2563eb",
    "light_blue": "#38bdf8",
    "purple": "#7c3aed",
    "brown": "#92400e",
    "beige": "#d6c4a8",
    "gold": "#d4a017",
    "silver": "#c0c7ce",
}

_CODE_ORDER = {code: index for index, code in enumerate(PRODUCT_COLOR_CODES)}

# 正規化済み別名 → コード。短い語は部分一致で誤爆しやすいので色名だけ。
_ALIAS_PAIRS: tuple[tuple[str, str], ...] = (
    ("white", "white"),
    ("黒", "black"),
    ("ブラック", "black"),
    ("black", "black"),
    ("グレー", "gray"),
    ("グレイ", "gray"),
    ("灰色", "gray"),
    ("gray", "gray"),
    ("grey", "gray"),
    ("赤", "red"),
    ("レッド", "red"),
    ("red", "red"),
    ("ピンク", "pink"),
    ("桃色", "pink"),
    ("pink", "pink"),
    ("オレンジ", "orange"),
    ("橙色", "orange"),
    ("橙", "orange"),
    ("orange", "orange"),
    ("黄色", "yellow"),
    ("イエロー", "yellow"),
    ("黄", "yellow"),
    ("yellow", "yellow"),
    ("グリーン", "green"),
    ("黄緑", "green"),
    ("緑", "green"),
    ("green", "green"),
    ("ライトブルー", "light_blue"),
    ("水色", "light_blue"),
    ("空色", "light_blue"),
    ("シアン", "light_blue"),
    ("cyan", "light_blue"),
    ("lightblue", "light_blue"),
    ("skyblue", "light_blue"),
    ("ブルー", "blue"),
    ("ネイビー", "blue"),
    ("紺", "blue"),
    ("navy", "blue"),
    ("青", "blue"),
    ("blue", "blue"),
    ("パープル", "purple"),
    ("ラベンダー", "purple"),
    ("紫", "purple"),
    ("purple", "purple"),
    ("ブラウン", "brown"),
    ("茶色", "brown"),
    ("茶", "brown"),
    ("brown", "brown"),
    ("ベージュ", "beige"),
    ("クリーム", "beige"),
    ("生成り", "beige"),
    ("beige", "beige"),
    ("cream", "beige"),
    ("ゴールド", "gold"),
    ("金色", "gold"),
    ("金", "gold"),
    ("gold", "gold"),
    ("シルバー", "silver"),
    ("銀色", "silver"),
    ("銀", "silver"),
    ("silver", "silver"),
    ("白", "white"),
    ("ホワイト", "white"),
)

_EXACT = {alias: code for alias, code in _ALIAS_PAIRS}
_BY_LENGTH = sorted(_ALIAS_PAIRS, key=lambda pair: len(pair[0]), reverse=True)


def _norm_label(raw: str) -> str:
    return raw.strip().lower().replace(" ", "").replace("　", "")


def match_product_color_codes(labels: list[str]) -> list[str]:
    """写真の色名をカタログへ。多色ラベルは捨て、一致した色は複数返す。"""
    found: set[str] = set()
    for raw in labels:
        if not isinstance(raw, str):
            continue
        norm = _norm_label(raw)
        if not norm:
            continue
        exact = _EXACT.get(norm)
        if exact:
            found.add(exact)
            continue
        for alias, code in _BY_LENGTH:
            if alias in norm:
                found.add(code)
    return [code for code in PRODUCT_COLOR_CODES if code in found]


def coerce_product_color_codes(raw: Any) -> list[str]:
    """DB から読んだ配列。未知値は落とす（一覧を落とさない）。"""
    if not isinstance(raw, list):
        return []
    found = {str(item).strip().lower() for item in raw}
    return [code for code in PRODUCT_COLOR_CODES if code in found]


def normalize_product_color_codes(raw: list[str] | None) -> list[str]:
    """保存・検索用。未知コードは拒否し、重複を除いてカタログ順にする。"""
    if raw is None:
        return []
    if not isinstance(raw, list):
        raise ValueError("未対応のグッズの色です")
    found: set[str] = set()
    for item in raw:
        code = str(item or "").strip().lower()
        if code not in _CODE_ORDER:
            raise ValueError("未対応のグッズの色です")
        found.add(code)
    return [code for code in PRODUCT_COLOR_CODES if code in found]


def parse_product_color_query(raw: str | None) -> list[str]:
    """カンマ区切りの色コード。空は絞らない。"""
    if raw is None or not str(raw).strip():
        return []
    parts = [part.strip() for part in str(raw).split(",") if part.strip()]
    if len(parts) > len(PRODUCT_COLOR_CODES):
        raise ValueError("未対応のグッズの色です")
    return normalize_product_color_codes(parts)


def build_product_color_share(
    *,
    code_lists: list[list[str]],
    product_total: int,
) -> dict[str, Any]:
    """1グッズの複数色はそれぞれ加算。件数0の色は出さない。"""
    counts: Counter[str] = Counter()
    colored = 0
    for raw in code_lists:
        if not isinstance(raw, list):
            continue
        unique = {code for code in raw if code in _CODE_ORDER}
        if not unique:
            continue
        colored += 1
        for code in unique:
            counts[code] += 1
    assignment_total = int(sum(counts.values()))
    items: list[dict[str, Any]] = []
    for code, count in counts.items():
        share = round(count / assignment_total, 4) if assignment_total else 0.0
        items.append(
            {
                "product_color_code": code,
                "product_color_hex": PRODUCT_COLOR_HEX[code],
                "count": int(count),
                "share": share,
            }
        )
    items.sort(key=lambda row: (-int(row["count"]), _CODE_ORDER[row["product_color_code"]]))
    total = max(0, int(product_total))
    return {
        "items": items,
        "assignment_total": assignment_total,
        "product_total": total,
        "uncolored_count": max(0, total - colored),
    }
