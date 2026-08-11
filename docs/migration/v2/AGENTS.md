# AGENTS.md（oshi-app v2 草案）

このファイルは Cursor 等のエージェント向けの入口。詳細は `.cursor/rules/` に委譲する。

## プロダクト

推し活グッズ管理アプリ。バーコード・写真から登録し、収納タグで実物とデータをつなぐ。

## 技術スタック（v2）

- **Web**: Next.js（App Router）+ todo-app 系 UI / テーマ
- **API**: FastAPI（uvicorn）
- **Auth / DB / Storage**: 既存 Supabase プロジェクト継続
- **モバイル（後）**: Expo。同一 API + 同一 Auth
- **パッケージマネージャ**: pnpm workspaces

## 絶対ルール

1. **秘密情報・個人情報をログ・チャット・コミットに出さない**（JWT、service role、署名 URL 全文、`.env` 実値、実ユーザー PII）。詳細は `.cursor/rules/security.md`。
2. **UI とドメインを混ぜない**。Next は表示と Auth セッション。業務ロジックは FastAPI `services/`。
3. **テナンシーの正は `members_id` = Supabase `auth.users.id`（JWT の `sub`）**。クライアントから「他人の id」を信用して絞り込まない（RLS / サーバ検証が最終）。
4. **認証は自前 JWT サーバーを作らない**。発行は Supabase Auth のみ。
5. **Flask + Cookie でアプリ全体を守る Dash 時代の方式は使わない**（詳細は `auth.md`）。
6. コメント・運用ドキュメントは日本語。
7. Git 利用時は `git config core.hooksPath .githooks` をリポジトリローカルで有効化し、`scripts/secret_guard.py` をスキップしない。

## 層境界

```text
apps/web     → 画面・フォーム・@supabase/ssr セッション・API 呼び出し
apps/api     → HTTP・認可・ユースケース・Supabase アクセス
packages/*   → 共有定数・型（UI 依存禁止）
supabase/    → マイグレーション・RLS の正本
```

## 参照（詳細正本）

- 配置: `.cursor/rules/file_structure.md`
- 認証: `.cursor/rules/auth.md`
- API: `.cursor/rules/api_contract.md`
- セキュリティ: `.cursor/rules/security.md`
- DB: `.cursor/rules/database_configuration.md`（既存移植）
- 製品仕様: `.cursor/rules/spec.md`（既存移植）
- 変更後検証: `.cursor/skills/post-change-verify/SKILL.md`

## 品質

- 業務エラー（入力・権限）→ クライアント向けメッセージ + 適切な HTTP ステータス
- システムエラー → ログして上位へ。内部例外メッセージをそのままユーザーに出さない
