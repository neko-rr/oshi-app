from services.supabase_client import get_supabase_client
from services.photo_service import insert_product_record

supabase = get_supabase_client()
print('Client:', supabase)
insert_product_record(
    supabase,
    barcode='1234567890123',
    barcode_type='EAN-13',
    product_name='Test Product',
    image_url='https://example.com/test.jpg',
    description='sample description',
    tags=['tag1', 'tag2'],
    notes='sample note'
)
print('Insert succeeded')
