<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# デプロイ文書

| 文書 | 内容 |
|------|------|
| **[env-contract.md](env-contract.md)** | Web / API / Render / Cloudflare の **必須・任意キー一覧**（実値なし） |

手順の人向け ToDo: [../WAKE_UP.md](../WAKE_UP.md)  
ルール: `.cursor/rules/deploy.mdc`  
手順 skill: **`deploy-change`**（着手前 `official-docs-first`、完了後 `secure-change-checklist`）

## API 起床（Render Free 向け・一時策）

**目的:** Free プランは **15分無通信でスリープ**し、次リクエストで約1分かかることがある。ログイン／ゲスト開始／Google OAuth 成功直後に `GET /health` で起こす。

| 項目 | 内容 |
|------|------|
| 実装 | `apps/web/src/lib/wakeApi.ts`（呼び出し: ログインフォーム・ゲスト開始・`auth/callback`） |
| 無効化 | Cloudflare / ローカルで `NEXT_PUBLIC_API_WAKE_ON_AUTH=0` |
| スリープ条件 | API への HTTP が **連続15分なし**（操作中の `apiFetch` があれば寝ない） |

### 有料の常時起動プランに上げたら（必須で直す）

1. Render で API を **有料 compute**（スリープしないプラン）にする  
2. **`NEXT_PUBLIC_API_WAKE_ON_AUTH=0`** を Cloudflare Workers env に置く（またはキー削除してコード既定をオフに変更）  
3. 余裕があれば `wakeApi` 呼び出しと本節を削除／「廃止済み」と注記  
4. 起こしは **秘密を増やさない**（公開 `/health` のみ）。常時起動後は不要な往復なので止める  
