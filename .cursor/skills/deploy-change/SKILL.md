---
name: deploy-change
description: >-
  Render（API）・Cloudflare（Web）・本番 env / CORS / Auth Redirect を触る前と後に適用する。
  デプロイ設定、公開 URL、ホスト別環境変数、WAKE_UP のクラウド作業のとき必須。
---

# デプロイ変更（oshi_app）

## いつ使うか（必須）

- Render / Cloudflare / 本番 URL の追加・変更
- `CORS_ORIGINS`、`NEXT_PUBLIC_*`、Auth Redirect / Site URL
- `docs/deploy/` / `docs/WAKE_UP.md` のデプロイ手順更新
- 「本番に上げる」「公開面の env」作業

ローカルだけの `.env.example` 文言修正で、ホスト契約が変わらないなら不要。

## 正本マップ

| 何 | どこ |
|----|------|
| 命令（薄い） | `.cursor/rules/deploy.mdc` |
| **env 必須／禁止（キー名のみ）** | `docs/deploy/env-contract.md` |
| 入口 | `docs/deploy/README.md` |
| 人が Dashboard でやる ToDo | `docs/WAKE_UP.md` |
| 手/自動の見分け | `docs/README.md` |
| 認証 | `.cursor/rules/auth.mdc` + skill `official-docs-first` |
| 秘密境界 | `.cursor/rules/security.mdc` |

## 着手前

1. skill **`official-docs-first`**（Render / Cloudflare / Supabase Auth URL）
2. `docs/deploy/env-contract.md` を開き、触るホスト列だけ確認
3. 実値・Dashboard の中身をチャット・コミット・ログに出さない
4. 振る舞い変更なら `tdd-workflow`（例: CORS 既定のコード変更）

## ホスト別の原則（要約）

| ホスト | 置け | 置くな |
|--------|------|--------|
| **Cloudflare（Web）** | `NEXT_PUBLIC_*` のみ | secret / service_role / JWT 秘密 / DB URL / `IO_*` |
| **Render（API）** | `SUPABASE_URL` + publishable、本番 `CORS_ORIGINS`、必要なら JWKS / Assist | Legacy `SUPABASE_JWT_SECRET` に頼るな。localhost を本番 CORS に残すな |
| **Supabase Dashboard** | Site URL / Redirect / Signing Keys | キーを Git にコピーするな |
| **リポジトリ** | `.env.example`（空／ダミー）、契約ドキュメント | `.env` 実体 |

詳細表は `env-contract.md` を正とする（ここに実値を書くな）。

## 実行手順

1. 変更内容を一文にする（例:「本番 Web を CF、API を Render。CORS を本番オリジンのみ」）
2. `env-contract.md` / `.env.example` の **キー名** を必要なら更新（実値は書かない）
3. Dashboard 側は `WAKE_UP.md` の手順で **人が** 設定（エージェントはキー名とチェックリストまで）
4. Auth Redirect / Site URL を本番 Web に合わせる
5. Web の `NEXT_PUBLIC_API_BASE_URL` は **HTTPS の API**
6. コードに CORS 既定や公開 URL 組み立てがあれば追随 + テスト

## 完了後チェック

- [ ] Cloudflare に secret / service_role / DB URL を置いていない
- [ ] 本番 `CORS_ORIGINS` に開発用 localhost が残っていない
- [ ] API は JWKS 経路のまま（Legacy JWT Secret を正にしていない）
- [ ] `/health` は意図どおり公開、業務 API は認証付き
- [ ] `env-contract.md` と `.env.example` がキー名だけ整合
- [ ] skill **`secure-change-checklist`**
- [ ] コードを触ったら **`post-change-verify`**
- [ ] 秘密・実 URL のトークン類をチャットに出していない

## やらないこと

- 本番シークレットをリポジトリや CF にコミット／配置
- `SUPABASE_JWT_SECRET` を検証の正にする
- Dashboard の実値をドキュメントや issue に貼る

## 関連

- skill `official-docs-first` / `secure-change-checklist` / `db-schema-change`（DB 側）
- 公式: https://render.com/docs / https://developers.cloudflare.com/pages/
- Auth: https://supabase.com/docs/guides/auth/jwts
