<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# DB・API セキュリティ（初学者向け）

このアプリ（Oshihaven／技術リポジトリ名 oshi_app）のデータを守る考え方です。  
公式の二段構え: [Securing your API](https://supabase.com/docs/guides/api/securing-your-api) / [Product security](https://supabase.com/docs/guides/security/product-security)

## たとえ話

| たとえ | 実際 |
|--------|------|
| 玄関の鍵の種類 | `anon`（未ログイン）/ `authenticated`（ログイン済）/ `service_role`（管理者） |
| 建物に入れるか | **GRANT**（表への権限） |
| どの部屋の荷物か | **RLS**（行のルール。自分の `members_id` だけ） |
| マスターキー | `service_role`（RLS を無視できる。フロント禁止） |

**両方必要です。** GRANT だけ／RLS だけ、は不十分です。

## このプロジェクトのルール

1. Web に載せてよいのは **URL + publishable キー** だけ（`security.mdc`）
2. 業務データは **ユーザー JWT + RLS**（`auth.mdc`）。通常経路で service_role を使わない
3. ユーザー所有表は `members_id = auth.uid()`
4. **Anonymous Sign-In** を使う場合は、全 wired 表＋Storage に `is_anonymous` 拒否（RESTRICTIVE / `jwt_is_permanent_user()`）を必須とする。Anonymous は `authenticated` ロールのため、members_id チェックだけでは足りない
5. **`handle_new_user` / `handle_user_became_permanent`（auth.users トリガー）**  
   - 書き込み先は **`public.member`**（旧 `member_information` 禁止）  
   - **ゲスト（`is_anonymous`）では `member` 行を作らない**（肥大化・誤紐づけ防止）  
   - 本登録化時の UPDATE で upsert  
   - `SECURITY DEFINER` + 固定 `search_path`。`anon` / `authenticated` / `public` から **EXECUTE 不可**（トリガー専用）  
   - migration: `20261007140000_fix_handle_new_user_member.sql`
6. **未連携（schema_ready）の表は Data API から触らせない**（権限なし）。連携するときに明示 GRANT
7. 新規表はテンプレ `docs/db/new-table-template.sql` に従う

## 表の区分

| 区分 | 意味 | 権限の目安 |
|------|------|------------|
| `wired` | アプリが使う | `authenticated` に必要最小限 + RLS。**anon は不可** |
| `schema_ready` | DB にあるが未連携 | **anon / authenticated とも不可**（精査後に開く） |
| `storage` | ファイル | Private バケット + 自分のパスのみ |

## Dashboard でやる設定（コード外）

- [x] JWT Signing Keys（JWKS）を有効化し、API は JWKS 検証（運用中は都度確認）
- [x] Storage `photos` / `exports` は Private（ライブ `storage.buckets.public = false` 確認済み・2026-10-07）
- [x] Auth CAPTCHA（Turnstile）— Attack Protection（Secret は Dashboard のみ）
- [ ] **漏洩パスワード保護**（下記「公開前チェック」）
- [ ] Auth **Rate Limits** の確認（下記「不正アクセス・大量アクセス」）

### 公開前チェック — 漏洩パスワード保護（Have I Been Pwned）

| 項目 | 内容 |
|------|------|
| 何をするか | Supabase Auth で漏洩済みパスワードの利用を拒否する |
| 公式 | [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) |
| 現状（2026-08-29） | **Pro プラン以上が必要**のため未設定。無料枠では ON にできない |
| いつやるか | **アプリを一般公開するとき**（有料プラン移行と合わせて検討） |
| Git に書いてよいか | **よい**（手順・プラン要件のメモ。秘密情報ではない） |

Advisor に「Leaked Password Protection Disabled」と出ても、プラン制約なら公開まで保留でよい。

### パスキー（Passkeys）— 導入しない（2026-10-07 決定）

| 項目 | 内容 |
|------|------|
| 方針 | **今は導入しない**。Supabase Dashboard の Passkeys は **OFF** |
| 理由 | 公式が [experimental](https://supabase.com/docs/guides/auth/passkeys)。API 変更リスク。Must 本線（メール／Google／ゲスト＋Turnstile）で十分。ゲストは登録不可 |
| 再検討 | experimental 解除後、または一般公開後にユーザー需要がはっきりしたとき |
| 注意 | RP ID は後から変えると既存パスキーが無効になる。導入するときは慎重に固定する |
| 製品 ID | `auth_passkey`（`deferred`） |

### 不正アクセス・大量アクセス（2026-10-08）

**結論:** 限定公開〜個人開発規模では、現行本線で十分。緊急の追加実装は不要。残りは運用確認と公開後の候補。

#### すでに効いている本線

| 脅威 | 対策 |
|------|------|
| 他人データの閲覧・改ざん | RLS + `members_id` |
| 偽トークン | API の JWKS |
| ボットでの会員／ゲスト量産 | Turnstile（Auth CAPTCHA） |
| 写真の直リンク | Storage Private + signed URL |
| API の勝手なオリジン | 本番 `CORS_ORIGINS` 限定 |
| オープンリダイレクト | Site URL / Redirect 限定 |

#### 今やる（コード不要・運用）

| 項目 | 内容 |
|------|------|
| 管理画面 2FA | GitHub / Cloudflare / Supabase / Google Cloud / Render の本人アカウント |
| Auth Rate Limits | Supabase → Authentication → **Rate Limits** を確認（厳しすぎなければ既定のまま） |
| ゲスト掃除 | 30日超 Anonymous を月1（[WAKE_UP.md](../WAKE_UP.md)） |
| 依存更新 | Renovate 等（既知脆弱性の取り込み） |

#### 一般公開／Pro 前後

| 優先 | 項目 | メモ |
|------|------|------|
| P1 | 漏洩パスワード保護 ON | 上記 Have I Been Pwned |
| P1 | ログ監視の習慣 | Supabase Auth logs・Render ログ。連打・401 急増に気づく |
| P2 | Cloudflare ボット／Rate Limiting | ゾーンがある場合。Workers のみならプランを確認してから |
| P2 | FastAPI レート制限 | 現状なし。公開後に `/assist`・写真アップロードなど重い経路だけ検討 |
| P3 | ユーザー向け MFA | 需要が出てから |
| deferred | パスキー | `auth_passkey`（上記） |

大量アクセス対策の本命は自前ミドルウェアより **Cloudflare 前面 + Auth Rate Limit + CAPTCHA**。Render Free は同時接続に弱いため、DDoS 級は CF 側で止める発想が現実的。

#### 今やらなくてよいこと

- API 全体への重いレート制限の即実装
- 自前 WAF／自前 CAPTCHA サーバ
- パスキー・ユーザー MFA の先行実装

人向け手順の入口: [WAKE_UP.md](../WAKE_UP.md)「不正アクセス・大量アクセス」。

## Advisor の見方（2026-08-29 harden 後）

| 出るもの | 意味 | 対応 |
|----------|------|------|
| schema_ready の「RLS ON だがポリシーなし」(INFO) | 権限もないので **閉じたまま** | 連携時に GRANT + ポリシー |
| wired 表の「authenticated に GraphQL で見える」(WARN) | ログイン済み API が触るため **想定内**。行は RLS で自分だけ | 放置可 |
| 漏洩パスワード保護オフ (WARN) | Auth 設定 | **Pro 以上で公開前に ON**（下表）。無料枠では保留可 |

## 変更したら

1. skill `db-schema-change`
2. Supabase MCP `get_advisors`（type: `security`）
3. skill `secure-change-checklist` / `post-change-verify`

## 関連

- 入口: [README.md](README.md)
- 命名: [naming.md](naming.md)
- カタログ: [schema-catalog.md](schema-catalog.md)
- 新表: [new-table-template.sql](new-table-template.sql)
