<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# フロー: ゲスト開始 → 本登録

## 目的

ログイン壁の前にアプリの画面を触れ、グッズ保存や API の直前で本登録させる。

## 入口

ホーム（未ログイン）は「ログイン」のみ。`/auth/login` の「ゲストではじめる」→ Supabase `signInAnonymously()`。開始後にギャラリー／登録などを出す。

## ゲスト中にできること

- ホーム・空のギャラリー／設定シェルの閲覧
- 登録ウィザードの画面操作・端末内下書き
- カメラ UI・ローカル写真プレビュー（アップロードなし）
- 進み方を選ぶ。**画面だけ確認**はスキップで進む（CAPTCHA なし）。**API（自動タグ付け）を試す**は楽天照合と写真抽出（CAPTCHA 成功後、合計1時間3回。結果は画面のみ）
- 色ラベルの見本選択（確認画面。保存しない）
- 見た目・表示・登録既定の **端末内** 変更（サーバー同期なし）

## 本登録が必要な操作

製品保存、写真アップロード、キーワード検索、Vision / タグ抽出、タグ／収納のサーバー CRUD、データ書き出し、ダッシュボード集計、見た目設定のサーバー同期など業務 API。バーコード照合の回数超過もここ（429）。

## 本登録

`/auth/upgrade` でメールを紐づけ（`updateUser`）→ 確認 → パスワード設定。  
`members_id`（`auth.users.id`）は変わらない。

## 契約メモ

- JWT claim `is_anonymous: true`
- API は 403 `REGISTRATION_REQUIRED`（退会 `DELETE /account` はゲスト可）
- RLS は RESTRICTIVE で Anonymous を拒否（API と二重）

## 機能追加時チェックリスト（ゲスト UX）

新機能・新画面を足すときは、ゲストで触ったときに **生の API エラーだけで終わらない** こと。次を確認する。

| 種別 | やること | 既存の型 |
|------|----------|----------|
| 端末のみで足りる設定 | 画面に `GuestContextNotice`（`localOnly`） | `/settings`・`/settings/theme`・`/settings/register` |
| サーバー CRUD / 書き出し / 集計 | `GuestServerGate` または同等の案内＋操作 UI 非表示 | タグ・収納・export・dashboard |
| 一覧など空状態 | ゲスト向け文言＋`/auth/upgrade` リンク | gallery |
| 操作ボタン（保存・アップロード等） | `RegistrationRequiredDialog` 等でゲート | RegisterWizard |
| API / RLS | `require_permanent_user` ＋（DB なら）Anonymous 拒否 | 業務ルータ |
| 見た目系の同期 | ゲストは API GET/PUT をスキップ（`canSyncUserPrefsToServer`） | `useTheme` / `useDisplaySettings` |

受け入れ: `docs/product/acceptance/auth.md` / `settings.md`。全体バナーは `GuestBanner`（AppChrome）。
