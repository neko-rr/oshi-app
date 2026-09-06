<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# フロー: 退会・全データ削除

## 目的

自分のアカウントとアプリ内データを完全に消し、「データは自分のもの」とストア審査・個人情報の説明を矛盾させない。

## 入口

設定 → データの書き出しの近く → 退会・データ削除（`/settings/delete-account`）  
プライバシーポリシーからも導線あり。

## 手順

1. 警告を読む（取り消し不可・即時）
2. 必要なら先に `/settings/export` で書き出す
3. 確認語 `DELETE` を入力する
4. 退会を実行する
5. API が Storage（`photos` / `exports`）を掃除し、Auth ユーザーを削除する（DB は CASCADE）
6. クライアントはサインアウトし、ログイン画面へ戻る

## 契約メモ

- `DELETE /account` + `{ "confirmation": "DELETE" }`
- `members_id` は JWT `sub` のみ（なりすまし不可）
- 猶予期間なし（v1 は即時）
- Expo 専用画面は未実装（API は Bearer 互換）
