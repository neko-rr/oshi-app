# Dash コールバック計測手順（ベースライン）

本ドキュメントは「初回発火コールバック整理」計画 Step 1 の **再現可能な計測**用です。数値は環境依存のため、変更 PR の前後で **同じ手順・同じブラウザ** を使って比較してください。

## 前提

- 同一ユーザーでログイン済み（`http://127.0.0.1:8050` に統一。`Cursor.md` 参照）。
- 本番相当: `AUTH_DEBUG` / `DASH_DEBUG` 未設定または `0`。
- Chrome / Edge: DevTools → Network → `Fetch/XHR` フィルタ → `update-component` で検索。

## 記録テンプレート（PR 前後で複写）

| シナリオ | `/_dash-update-component` 件数（概算） | 備考 |
|----------|------------------------------------------|------|
| `/` 初回（ハードリロード） | | `render_home` の DB は Network に出ない → **Document の TTFB** もメモ |
| `/gallery` 初回 | | `supabase.co` / Storage の待ち時間 |
| `/register/review` 初回 | | タグ loading 中は Interval により増える |

## 記録項目（各シナリオ）

1. ページ表示完了までの `POST /_dash-update-component` の **合計件数**（必要なら発火順を番号付け）。
2. 代表的な1リクエストの **Request payload サイズ感**（registration-store を含む画面は肥大化しやすい）。
3. `supabase.co` の並列数・待ち時間（ギャラリー・ホーム）。

## 注意（セキュリティ）

HAR やスクショを共有する際は **Cookie・Authorization・署名付き URL** をマスクすること（`Cursor.md` の Step 1b 参照）。

## ベースライン記入欄（実測値）

以下は実装変更後に手動で埋めてバージョン管理するか、社内メモに残してください。

| 日付 | ブランチ / PR | `/` POST数 | `/gallery` POST数 | `/register/review` POST数 | メモ |
|------|---------------|------------|-------------------|---------------------------|------|
| | | | | | |
