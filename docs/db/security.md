<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# DB・API セキュリティ（初学者向け）

このアプリ（oshi_app）のデータを守る考え方です。  
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
4. **未連携（schema_ready）の表は Data API から触らせない**（権限なし）。連携するときに明示 GRANT
5. 新規表はテンプレ `docs/db/new-table-template.sql` に従う

## 表の区分

| 区分 | 意味 | 権限の目安 |
|------|------|------------|
| `wired` | アプリが使う | `authenticated` に必要最小限 + RLS。**anon は不可** |
| `schema_ready` | DB にあるが未連携 | **anon / authenticated とも不可**（精査後に開く） |
| `storage` | ファイル | Private バケット + 自分のパスのみ |

## Dashboard でやる設定（コード外）

- [x] JWT Signing Keys（JWKS）を有効化し、API は JWKS 検証（運用中は都度確認）
- [ ] Storage `photos` は Private
- [ ] **漏洩パスワード保護**（下記「公開前チェック」）

### 公開前チェック — 漏洩パスワード保護（Have I Been Pwned）

| 項目 | 内容 |
|------|------|
| 何をするか | Supabase Auth で漏洩済みパスワードの利用を拒否する |
| 公式 | [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection) |
| 現状（2026-08-29） | **Pro プラン以上が必要**のため未設定。無料枠では ON にできない |
| いつやるか | **アプリを一般公開するとき**（有料プラン移行と合わせて検討） |
| Git に書いてよいか | **よい**（手順・プラン要件のメモ。秘密情報ではない） |

Advisor に「Leaked Password Protection Disabled」と出ても、プラン制約なら公開まで保留でよい。

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
