-- === 拡張版 Storage ポリシー (複数画像形式対応) ===

-- 現在の条件:
-- bucket_id = 'photos' AND storage.extension(name) = 'jpg' AND LOWER((storage.foldername(name))[1]) = 'public' AND auth.role() = 'anon'

-- 拡張版条件:
bucket_id = 'photos'
AND (
  storage.extension(name) IN ('jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'heif')
)
AND auth.role() = 'anon'

-- === 説明 ===
-- 1. bucket_id = 'photos': photosバケットのみ
-- 2. storage.extension(name) IN (...): 複数画像形式許可
-- 3. auth.role() = 'anon': 匿名ユーザー許可
-- ※ フォルダ制限は削除（バケット全体を許可）
