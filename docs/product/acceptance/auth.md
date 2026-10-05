<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# DoD: 認証

- [x] 未ログインのホームとヘッダーはログイン入口のみ（ギャラリー等はセッション開始後）
- [x] メール／パスワードでサインアップ・ログインできる
- [x] ログイン画面で Google・メール／パスワード・ゲストをまとめて選べる
- [x] Google は `/auth/callback` で PKCE の code をセッションに交換する
- [x] ログイン後 `/me`（API）で自分の `members_id` が取れる
- [x] `/me` に `is_anonymous` が返り、ゲストと本登録を区別できる
- [x] 「ゲストではじめる」で Anonymous セッションを開始できる
- [x] ゲストは `/auth/upgrade` で同一 user にメール本登録できる
- [x] ゲストの業務 API 呼び出しは 403 `REGISTRATION_REQUIRED`（退会は可）
- [x] ゲストは設定の端末のみ項目で「本登録で同期」案内（`GuestContextNotice` localOnly）、サーバー必須画面では操作 UI を隠し案内（`GuestServerGate` / export）
- [x] ゲストはギャラリー・ダッシュボードで生エラーではなく本登録 CTA を見る
- [x] ログアウトできる（ヘッダー・設定・/me）
- [x] 秘密・JWT を画面やログに出さない

関連: `auth_session` / `guest_onboarding` / `docs/product/flows/guest.md` / `.cursor/rules/auth.mdc`
