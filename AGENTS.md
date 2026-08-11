# AGENTS.md（エージェント入口）

このファイルは Cursor 等のエージェント向けの入口。詳細は `.cursor/rules/` に委譲する。

## プロダクト

推し活グッズ管理アプリ。バーコード・写真から登録し、収納タグで実物とデータをつなぐ。

## 技術スタック（v2）

- **Web**: Next.js（App Router）`apps/web`
- **API**: FastAPI `apps/api`
- **Auth / DB / Storage**: Supabase（既存プロジェクト）
- **モバイル（後）**: Expo `apps/mobile`
- **パッケージ**: pnpm workspaces

## 絶対ルール

1. 秘密情報をログ・チャット・コミットに出さない（`.cursor/rules/security.md`）
2. UI とドメインを混ぜない（業務は FastAPI `services/`）
3. テナンシーは `members_id` = JWT `sub`
4. 認証発行は Supabase Auth のみ（Flask PKCE しない）
5. 命名は `.cursor/rules/naming.md` / `docs/migration/v2/glossary.md`
6. **TDD**: 振る舞い変更は失敗するテストを先に（`tdd.md`）
7. Git: `core.hooksPath=.githooks`、`--no-verify` 禁止
8. コメントは日本語

## 参照

| 内容 | パス |
|------|------|
| 優先順位 | `.cursor/rules/architecture.md` |
| 配置 | `docs/migration/v2/rules/file_structure.md` |
| 認証 | `.cursor/rules/auth.md` |
| API | `docs/migration/v2/rules/api_contract.md` |
| 命名 | `.cursor/rules/naming.md` |
| TDD | `.cursor/rules/tdd.md` |
| DB | `.cursor/rules/database_configuration.md` |
| 仕様 | `.cursor/rules/spec.md` |

## 品質

- 業務エラー → ユーザー向けメッセージ + HTTP ステータス
- システムエラー → ログして上位へ
- 変更後: skill `post-change-verify`
