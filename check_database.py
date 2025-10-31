#!/usr/bin/env python3
# -*- coding: utf-8 -*-

from services.supabase_client import get_supabase_client

def main():
    client = get_supabase_client()
    if client:
        try:
            # 最新の製品情報を取得
            result = client.table('registration_product_information').select('*').order('registration_product_id', desc=True).limit(5).execute()
            print('=== 最新の製品情報 (最新5件) ===')
            for item in result.data:
                product_id = item.get('registration_product_id', 'N/A')
                product_name = item.get('product_name', 'N/A')
                photo_id = item.get('photo_id', 'N/A')
                created_at = item.get('creation_date', 'N/A')
                print(f'ID: {product_id}, 製品名: {product_name}, 写真ID: {photo_id}, 作成日: {created_at}')

            # Storageのファイル一覧を確認
            print('\n=== Storage ファイル一覧 ===')
            try:
                files = client.storage.from_('photos').list()
                print(f'ファイル数: {len(files)}')
                for file in files[:3]:  # 最新3件
                    print(f'ファイル: {file["name"]}')
            except Exception as e:
                print(f'Storage確認エラー: {e}')

        except Exception as e:
            print(f'データベース確認エラー: {e}')
    else:
        print('Supabaseクライアント取得失敗')

if __name__ == '__main__':
    main()
