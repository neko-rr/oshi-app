import os
from services.photo_service import insert_product_record
from services.supabase_client import get_supabase_client

supabase = get_supabase_client()
if supabase:
    try:
        members_id = os.getenv("TEST_MEMBERS_ID")
        if not members_id:
            print("SKIP: TEST_MEMBERS_ID is not set; aborting insert.")
        else:
        # テストデータを挿入
        insert_product_record(
            supabase,
                members_id=members_id,
            photo_id=None,
            barcode='123456789',
            barcode_type='EAN13',
            product_name='テスト商品',
            product_group_name='テストグループ',
            works_series_name='テストシリーズ',
            title='テストタイトル',
            character_name='テストキャラクター',
            purchase_price=1000,
            purchase_location='テスト店舗',
            memo='テストメモ'
        )
        print('SUCCESS: テストデータ挿入成功')

            # データ確認
            result = supabase.table('registration_product_information').select('*').order('registration_product_id', desc=True).limit(1).execute()
            if result.data:
                print('最新データ:', result.data[0])
            else:
                print('データが見つかりません')

    except Exception as e:
        print(f'ERROR: {e}')
else:
    print('Supabaseクライアントが取得できません')
