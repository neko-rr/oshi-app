-- === Storageポリシー修正SQL (既存ポリシーを置き換え) ===

-- 1. 既存のポリシーを削除
DROP POLICY IF EXISTS "Give anon users access to JPG images in folder 1io9m69_0" ON storage.objects;

-- 2. 新しい拡張ポリシーを作成 (複数画像形式対応)
CREATE POLICY "Allow anon users access to images in photos bucket"
ON storage.objects
FOR ALL  -- SELECT, INSERT, UPDATE, DELETE すべて許可
USING (
  bucket_id = 'photos'
  AND (
    storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif')
  )
  AND auth.role() = 'anon'
)
WITH CHECK (
  bucket_id = 'photos'
  AND (
    storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif')
  )
  AND auth.role() = 'anon'
);

-- === 完了 ===
-- これで匿名ユーザーが複数の画像形式をアップロード・表示可能になります
