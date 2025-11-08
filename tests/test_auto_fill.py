#!/usr/bin/env python3
"""
STEP4自動反映機能をテストするスクリプト
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.io_intelligence import describe_image

def test_tag_classification():
    """タグ分類機能をテスト"""
    # サンプルタグ
    sample_tags = [
        "badge", "pin", "button", "sticker", "poster", "card", "figure",
        "character", "girl", "boy", "anime", "manga", "chibi", "cute",
        "bangdream", "lovelive", "idol", "music", "band", "series",
        "red", "blue", "round", "square", "text", "logo", "background"
    ]

    print("=== タグ分類テスト ===")
    print(f"サンプルタグ: {sample_tags}")

    # タグを分類
    product_related = []
    character_related = []
    work_related = []
    other_features = []

    for tag in sample_tags:
        tag_lower = tag.lower()
        if any(keyword in tag_lower for keyword in ['badge', 'keychain', 'sticker', 'poster', 'card', 'figure', 'goods', 'merchandise', 'pin', 'button', 'acrylic']):
            product_related.append(tag)
        elif any(keyword in tag_lower for keyword in ['character', 'girl', 'boy', 'person', 'anime', 'manga', 'chibi', 'cute']):
            character_related.append(tag)
        elif any(keyword in tag_lower for keyword in ['bangdream', 'lovelive', 'idol', 'music', 'band', 'series']):
            work_related.append(tag)
        else:
            other_features.append(tag)

    print(f"製品関連: {product_related}")
    print(f"キャラクター関連: {character_related}")
    print(f"作品関連: {work_related}")
    print(f"その他の特徴: {other_features}")

    # フィールド割り当てテスト
    product_group_name = product_related[0] if product_related else ""
    works_series_name = work_related[0] if work_related else ""
    works_name = work_related[1] if len(work_related) >= 2 else ""
    character_name = " ".join(character_related[:2]) if character_related else ""
    remaining_tags = other_features[:5]
    memo_tags = other_features[5:8]

    other_tags = [{"label": tag, "value": tag} for tag in remaining_tags] if remaining_tags else []
    memo = f"特徴: {', '.join(memo_tags)}" if memo_tags else ""

    print("\n=== フィールド割り当て結果 ===")
    print(f"製品グループ名: '{product_group_name}'")
    print(f"作品シリーズ名: '{works_series_name}'")
    print(f"作品名: '{works_name}'")
    print(f"キャラクター名: '{character_name}'")
    print(f"メモ: '{memo}'")
    print(f"その他タグ: {[t['value'] for t in other_tags]}")

def test_io_intelligence():
    """IO Intelligence機能をテスト"""
    print("\n=== IO Intelligenceテスト ===")

    # テスト用の画像データ（Base64エンコードされた小さな画像）
    # 実際のテストでは本物の画像データが必要
    test_image_data = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="

    try:
        result = describe_image(test_image_data)
        print(f"IO Intelligence result: {result}")
    except Exception as e:
        print(f"IO Intelligence error: {e}")

if __name__ == "__main__":
    test_tag_classification()
    test_io_intelligence()
