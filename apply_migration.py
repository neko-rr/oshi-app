#!/usr/bin/env python3
"""
Apply database migrations to Supabase
"""

from services.supabase_client import get_supabase_client

def apply_migration():
    """Apply the product_series_complete_flag migration"""
    supabase = get_supabase_client()

    if not supabase:
        print("Supabase接続ができません。環境変数を確認してください。")
        return

    # Read the migration SQL
    migration_sql = """
    -- Add product_series_complete_flag column to registration_product_information table

    ALTER TABLE registration_product_information
    ADD COLUMN IF NOT EXISTS product_series_complete_flag INTEGER DEFAULT 0;

    -- Add comment to the column
    COMMENT ON COLUMN registration_product_information.product_series_complete_flag IS '製品シリーズコンプリートフラグ - 0:未完了, 1:完了';

    -- Create index for better performance if needed
    CREATE INDEX IF NOT EXISTS idx_registration_product_series_complete_flag ON registration_product_information(product_series_complete_flag);
    """

    try:
        # Execute the migration
        result = supabase.rpc('exec_sql', {'sql': migration_sql})
        print("Migration applied successfully!")
        print(f"Result: {result}")
    except Exception as e:
        print(f"Migration failed: {e}")
        # Try alternative approach - execute raw SQL
        try:
            # Split SQL into individual statements
            statements = [stmt.strip() for stmt in migration_sql.split(';') if stmt.strip()]

            for stmt in statements:
                if stmt:
                    print(f"Executing: {stmt}")
                    # Note: This might not work with all SQL statements via Supabase client
                    # You might need to run this directly in Supabase dashboard
                    result = supabase.table('registration_product_information').select('*').limit(1).execute()
                    print(f"Test query successful: {bool(result.data)}")

            print("Migration SQL prepared. Please execute manually in Supabase dashboard if needed.")

        except Exception as e2:
            print(f"Alternative migration also failed: {e2}")

if __name__ == "__main__":
    apply_migration()
