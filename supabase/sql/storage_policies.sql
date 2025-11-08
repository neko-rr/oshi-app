-- === SUPABASE STORAGE POLICIES SQL (開発用: RLS無効化) ===
-- このSQLをSupabase SQL Editorにコピーして実行してください

-- 1. photosバケットの作成確認（存在しない場合）
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Row Level Securityを無効化（開発用）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- === ポリシー設定完了 ===
