<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# バックアップ / 復元（運用）

秘密（DB パスワード・接続文字列）は **Git に書かない**。Dashboard / パスワードマネージャのみ。

## 何を守るか

| 対象 | 場所 |
|------|------|
| テーブルデータ | Supabase Postgres |
| 写真ファイル | Storage バケット `photos` |
| スキーマ履歴 | リポの `supabase/migrations/` + `docs/db/generated/` |

## バックアップ（人間作業）

### A. Supabase Dashboard（手軽）

1. Project → **Database** → Backups（プランにより日次バックアップあり）
2. 必要なら **Point-in-time recovery**（有料プラン）を確認
3. Storage は別管理。重要データは定期エクスポート方針を決める

### B. 論理ダンプ（上級・ローカル）

1. Dashboard で Database 接続文字列（URI）を取得 → ローカルだけに保存
2. `pg_dump` でスキーマ＋データ（コマンドは公式 docs に従う）
3. ダンプファイルを暗号化バックアップ先へ（リポに入れない）

接続文字列の取り扱い: [Connecting to Postgres](https://supabase.com/docs/guides/database/connecting-to-postgres)

## 復元の考え方

1. **スキーマ**は migrations を順に適用（または新規プロジェクトへ）
2. **データ**は Backup / dump から戻す
3. **Storage** はオブジェクトを別途戻す
4. 復元後: `python scripts/generate_db_docs.py` で生成ドキュメントを同期
5. `get_advisors(security)` で権限を確認

## アプリ公開前チェック（DB）

- [ ] バックアップ方針（プランの Backups 有無）を決めた
- [ ] migrations がリポとライブで揃っている
- [ ] `docs/db/generated/` が最新
- [ ] 漏洩パスワード保護は Pro 時に検討（[security.md](security.md)）

## 関連

- [WAKE_UP.md](../WAKE_UP.md)
- [wire-checklist.md](wire-checklist.md)
