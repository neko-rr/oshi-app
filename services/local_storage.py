import sqlite3
import os
from typing import List, Dict, Any, Optional
from datetime import datetime

DB_PATH = "demo_database.db"

def init_database():
    """Initialize local SQLite database for demo"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Create photos table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS photos (
            photo_id INTEGER PRIMARY KEY AUTOINCREMENT,
            image_url TEXT,
            thumbnail_url TEXT,
            front_flag INTEGER DEFAULT 1,
            photo_registration_date TEXT,
            photo_edit_date TEXT
        )
    ''')

    # Create registration_product_information table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS registration_product_information (
            registration_product_id INTEGER PRIMARY KEY AUTOINCREMENT,
            photo_id INTEGER,
            product_name TEXT NOT NULL,
            product_group_name TEXT,
            works_series_name TEXT,
            title TEXT,
            character_name TEXT,
            barcode_number TEXT,
            barcode_type TEXT,
            purchase_price INTEGER,
            purchase_location TEXT,
            memo TEXT,
            product_series_flag INTEGER DEFAULT 0,
            product_series_complete_flag INTEGER DEFAULT 0,
            commercial_product_flag INTEGER DEFAULT 1,
            personal_product_flag INTEGER DEFAULT 0,
            digital_product_flag INTEGER DEFAULT 0,
            sales_desired_flag INTEGER DEFAULT 0,
            want_object_flag INTEGER DEFAULT 0,
            flag_with_freebie INTEGER DEFAULT 0,
            creation_date TEXT,
            updated_date TEXT,
            FOREIGN KEY (photo_id) REFERENCES photos (photo_id)
        )
    ''')

    conn.commit()
    conn.close()
    print("DEBUG: Local SQLite database initialized")

def insert_photo_record_local(image_url: str, thumbnail_url: str, front_flag: int = 1) -> Optional[int]:
    """Insert photo record into local database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO photos (image_url, thumbnail_url, front_flag, photo_registration_date, photo_edit_date)
            VALUES (?, ?, ?, ?, ?)
        ''', (image_url, thumbnail_url, front_flag, datetime.now().isoformat(), datetime.now().isoformat()))

        photo_id = cursor.lastrowid
        conn.commit()
        conn.close()

        print(f"DEBUG: Photo record inserted locally with ID: {photo_id}")
        return photo_id
    except Exception as e:
        print(f"DEBUG: Failed to insert photo record locally: {e}")
        return None

def insert_product_record_local(
    photo_id: int = None,
    barcode: str = None,
    barcode_type: str = None,
    product_name: str = None,
    product_group_name: str = None,
    works_series_name: str = None,
    title: str = None,
    character_name: str = None,
    purchase_price: int = None,
    purchase_location: str = None,
    memo: str = None,
    product_series_flag: int = 0,
    product_series_complete_flag: int = 0,
    commercial_product_flag: int = 1,
    personal_product_flag: int = 0,
    digital_product_flag: int = 0,
    sales_desired_flag: int = 0,
    want_object_flag: int = 0,
    flag_with_freebie: int = 0,
) -> None:
    """Insert product record into local database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('''
            INSERT INTO registration_product_information (
                photo_id, product_name, product_group_name, works_series_name, title, character_name,
                barcode_number, barcode_type, purchase_price, purchase_location, memo,
                product_series_flag, product_series_complete_flag, commercial_product_flag,
                personal_product_flag, digital_product_flag, sales_desired_flag, want_object_flag,
                flag_with_freebie, creation_date, updated_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (
            photo_id, product_name, product_group_name, works_series_name, title, character_name,
            barcode, barcode_type, purchase_price, purchase_location, memo,
            product_series_flag, product_series_complete_flag, commercial_product_flag,
            personal_product_flag, digital_product_flag, sales_desired_flag, want_object_flag,
            flag_with_freebie, datetime.now().isoformat(), datetime.now().isoformat()
        ))

        conn.commit()
        conn.close()

        print(f"DEBUG: Product record inserted locally - Name: {product_name}, Photo ID: {photo_id}")
    except Exception as e:
        print(f"DEBUG: Failed to insert product record locally: {e}")
        raise RuntimeError(f"ローカルデータベース保存に失敗しました: {str(e)}")

def get_all_products_local() -> List[Dict[str, Any]]:
    """Get all product records from local database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('''
            SELECT r.*, p.image_url, p.thumbnail_url
            FROM registration_product_information r
            LEFT JOIN photos p ON r.photo_id = p.photo_id
            ORDER BY r.creation_date DESC
        ''')

        columns = [desc[0] for desc in cursor.description]
        products = [dict(zip(columns, row)) for row in cursor.fetchall()]

        conn.close()
        return products
    except Exception as e:
        print(f"DEBUG: Failed to get products from local database: {e}")
        return []

def get_product_stats_local() -> Dict[str, int]:
    """Get product statistics from local database"""
    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute('SELECT COUNT(*) FROM registration_product_information')
        total_products = cursor.fetchone()[0]

        cursor.execute('SELECT COUNT(*) FROM photos')
        total_photos = cursor.fetchone()[0]

        conn.close()

        return {
            "total_products": total_products,
            "total_photos": total_photos
        }
    except Exception as e:
        print(f"DEBUG: Failed to get stats from local database: {e}")
        return {"total_products": 0, "total_photos": 0}
