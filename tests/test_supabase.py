#!/usr/bin/env python3
"""
Supabase接続テストスクリプト
"""

import os
from dotenv import load_dotenv
from services.supabase_client import get_supabase_client
from services.photo_service import get_all_products, get_product_stats

load_dotenv()


def test_supabase_connection():
    """Supabase接続をテスト"""
    print("Supabase接続テスト開始...")

    # 環境変数の確認
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_KEY")

    print(f"SUPABASE_URL: {supabase_url}")
    print(f"SUPABASE_KEY: {'設定済み' if supabase_key else '未設定'}")

    if not supabase_url or not supabase_key:
        print("環境変数が設定されていません")
        print("   .envファイルを作成して環境変数を設定してください")
        return False

    # Supabaseクライアントの取得
    supabase = get_supabase_client()
    if supabase is None:
        print("Supabaseクライアントの作成に失敗しました")
        return False

    print("Supabaseクライアント作成成功")

    try:
        # テーブル存在確認
        print("テーブル存在確認...")

        # productsテーブルの確認
        try:
            products = get_all_products(supabase)
            print(f"productsテーブル: 存在確認 ({len(products)}件のデータ)")
        except Exception as exc:
            print(f"productsテーブル: {exc}")

        # works_seriesテーブルの確認
        try:
            response = (
                supabase.table("works_series")
                .select("works_series_id")
                .limit(1)
                .execute()
            )
            if hasattr(response, "error") and response.error:
                print(f"works_seriesテーブル: {response.error}")
            else:
                print("works_seriesテーブル: 存在確認")
        except Exception as exc:
            print(f"works_seriesテーブル: {exc}")

        # 統計情報取得テスト
        try:
            stats = get_product_stats(supabase)
            print(
                f"統計情報取得: 合計{stats['total']}件, ユニークバーコード{stats['unique']}件"
            )
        except Exception as exc:
            print(f"統計情報取得: {exc}")

        print("Supabase接続テスト完了")
        return True

    except Exception as exc:
        print(f"テスト中にエラーが発生: {exc}")
        return False


if __name__ == "__main__":
    success = test_supabase_connection()
    if success:
        print("\nSupabaseが正しく設定されています！")
        print("   写真の登録機能が利用可能です。")
    else:
        print("\nSupabaseの設定を確認してください。")
        print("   UIは動作しますが、データ保存機能は利用できません。")
