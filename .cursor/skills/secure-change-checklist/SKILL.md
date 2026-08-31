---
name: secure-change-checklist
description: >-
  認証・認可・公開面・秘密・デプロイ設定を変えたあとに、漏えいと誤公開がないか確認する。
---

# セキュア変更チェック（v2）

## いつ使うか

- Auth / JWT / CORS / RLS / env / Render / Cloudflare を触った直後
- `NEXT_PUBLIC_*` やモバイル設定を増やしたとき
- `/me`・ギャラリー等の認証付き API が絡む修正のあと

## チェックリスト

### 秘密

- [ ] diff に `.env` 実値・トークン・secret・service_role・JWT 秘密がない
- [ ] ログ・テスト出力・チャットに Bearer / Cookie 全文がない
- [ ] `.env.example` だけが更新され、値は空またはダミー

### 認証

- [ ] API は JWKS 検証経路（Legacy Secret 依存を増やしていない）
- [ ] 保護 API が Bearer なしで 200 にならない
- [ ] DB 通常経路がユーザー JWT + RLS（不用意な service_role なし）

### DB / RLS（触った場合）

- [ ] anon に業務表を GRANT していない
- [ ] ユーザー所有は `members_id` + RLS
- [ ] schema_ready を広く開いていない
- [ ] MCP `get_advisors(security)` で新たな危険な WARN がない（許容は理由を残す）

### デプロイ（触った場合）

- [ ] 秘密はホスト Dashboard のみ
- [ ] Cloudflare に `NEXT_PUBLIC_*` 以外を置いていない（`docs/deploy/env-contract.md`）
- [ ] API `/health` が意図どおり公開、業務 API は認証付き

## 失敗時

1. マージ・push を止める
2. 漏えいの可能性があるキーは **ローテーション**（値を記録しない）
3. `cursor.md` に「何をローテしたか」だけ残す

## 関連

- `docs/deploy/env-contract.md`
- `.cursor/rules/security.mdc`
- `.cursor/rules/auth.mdc`
- `.cursor/rules/deploy.mdc`
- skill `official-docs-first`
