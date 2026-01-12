import os
from services.supabase_client import get_supabase_client
from services.photo_service import insert_product_record

supabase = get_supabase_client()
print('Client:', supabase)
members_id = os.getenv("TEST_MEMBERS_ID")
if not members_id:
    print("SKIP: TEST_MEMBERS_ID is not set; aborting insert.")
else:
    insert_product_record(
        supabase,
        members_id=members_id,
        barcode='1234567890123',
        barcode_type='EAN-13',
        product_name='Test Product',
        product_group_name='test',
        works_series_name='series',
        title='title',
        character_name='char',
        memo='sample note'
    )
    print('Insert succeeded')
