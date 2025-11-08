#!/usr/bin/env python3
"""
Test database schema and verify product_series_complete_flag column
"""

from services.supabase_client import get_supabase_client
from services.photo_service import get_all_products

def test_schema():
    """Test database schema"""
    supabase = get_supabase_client()

    if not supabase:
        print("Supabase接続ができません。")
        return

    try:
        # Test 1: Check if product_series_complete_flag column exists
        print("=== Testing product_series_complete_flag column ===")
        try:
            result = supabase.table("registration_product_information").select("product_series_complete_flag").limit(1).execute()

            if hasattr(result, 'data') and result.data:
                print("[OK] product_series_complete_flag column exists")
                if result.data:
                    flag_value = result.data[0].get('product_series_complete_flag')
                    print(f"[OK] Sample value: {flag_value}")
            else:
                print("[FAIL] product_series_complete_flag column not found")
        except Exception as e:
            print(f"[FAIL] product_series_complete_flag column error: {e}")
            print("Note: Please apply the migration manually in Supabase dashboard")

        # Test 2: Check photo table structure
        print("\n=== Testing photo table structure ===")
        photo_result = supabase.table("photo").select("*").limit(1).execute()

        if hasattr(photo_result, 'data'):
            print("[OK] photo table accessible")
            if photo_result.data:
                print(f"[OK] Photo table columns: {list(photo_result.data[0].keys())}")
        else:
            print("[FAIL] photo table not accessible")

        # Test 3: Test get_all_products function
        print("\n=== Testing get_all_products function ===")
        products = get_all_products(supabase)
        print(f"[OK] get_all_products returned {len(products)} products")

        print("\n=== Schema verification completed ===")

    except Exception as e:
        print(f"Schema test failed: {e}")

if __name__ == "__main__":
    test_schema()
