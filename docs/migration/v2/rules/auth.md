<!-- 更新: ARCHIVE寄り — 移行メモ。現行正本はルート AGENTS.md と .cursor/rules/*.mdc。凡例: docs/README.md -->
# 認証方針（v2 ドキュメント側）

**実装・エージェントの正本は** [`.cursor/rules/auth.mdc`](../../../.cursor/rules/auth.mdc)。

このファイルは移行ドキュメントからの入口。食い違う場合は `.mdc` を優先する。

要点:
- 発行: Supabase Auth のみ
- Web: `@supabase/ssr` + Cookie
- API / Mobile: Bearer + **JWKS 検証**（Legacy JWT Secret は正にしない）
- `members_id` = JWT `sub` + RLS
