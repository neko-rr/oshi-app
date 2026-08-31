---
name: official-docs-first
description: >-
  Auth・JWT・セキュリティ・DB権限・デプロイ・モバイル・アクセシビリティ着手の前に公式ドキュメントを確認する。
  仕様が変わりやすい領域で、記憶や古いルールだけに頼らない。
---

# 公式ドキュメント優先（v2）

## いつ使うか

次のいずれかを **実装・設定変更する直前**:

- Supabase Auth / JWT Signing Keys / JWKS / セッション
- `apps/api` の JWT 検証・CORS・RLS 付きクライアント
- **DB の GRANT / RLS / 新規表 / migration**（続けて skill `db-schema-change`）
- Render / Cloudflare の公開設定・環境変数
- Expo / モバイル Auth
- 公開キーと secret の境界
- **アクセシビリティ**（コントラスト・フォーカス・モーション）→ skill **`design-a11y`** を主に使う（この skill と併用可）

## 手順

1. 用途ルールを開く: `auth.mdc` / `security.mdc` / `database.mdc` / `deploy.mdc` / `mobile.mdc` / `platform.mdc` / `design.mdc`
2. 索引 `docs/refs/official-links.md` から該当 URL を選ぶ（DB なら Securing your API / Product security / Tables。a11y なら WCAG 2.2）
3. **WebFetch または公式ページで現行仕様を確認**（特に breaking / 非推奨）
4. プロジェクトルールと矛盾する場合: **公式のセキュリティ／a11y 推奨を優先**し、rules / `docs/design/a11y.md` 更新案を短く出す
5. 秘密の値はチャット・ログに出さない

## 確認の最低ライン（Auth）

- [ ] JWKS に `keys` がある（非対称運用時）
- [ ] Legacy JWT Secret を新規の正にしていない
- [ ] Web/Mobile に secret / service_role を入れてない
- [ ] `members_id` = JWT `sub`、RLS 前提

## 確認の最低ライン（DB）

- [ ] 新規／変更表に RLS ON
- [ ] anon に業務表を GRANT していない
- [ ] schema_ready を不用意に authenticated へ開いていない
- [ ] 変更後に `get_advisors(security)` を見ている
- [ ] 人間向け説明は `docs/db/security.md`

## 確認の最低ライン（a11y）

詳細は skill **`design-a11y`**。要約:

- [ ] WCAG 2.2 AA を目標にしている（現行 Recommendation）
- [ ] コントラスト／フォーカス／reduced-motion を公式で確認した
- [ ] ローカル `a11y.md` だけを最新仕様扱いにしていない

## やらないこと

- 公式を読まずに「以前こうだった」だけで Signing / デプロイ / GRANT / a11y を変える
- 索引ファイルだけを正本扱いする

## 委譲

公式ページの取得だけ **Task に委譲可**。ルールとの突合・変更可否の **判断は親**。表: `AGENTS.md`「Skill → Task / サブエージェント」。
