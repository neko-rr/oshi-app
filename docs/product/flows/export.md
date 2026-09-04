<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# フロー: データ書き出し

## 目的

自分の登録一覧を手元に残す（安心感）。再取り込み（インポート）はしない。

## 入口

設定 → データ書き出し（`/settings/export`）

## A: テキスト（在庫・一覧向け）

1. 「一覧を書き出す」を押す
2. API が ZIP（`manifest.json` ＋ CSV）を用意する
3. ダウンロードする

写真は ID／Storage パスのみ。署名 URL は含めない。

## B: 写真付き（推し整理向け）

1. 「写真付きで書き出す」を押す
2. 準備中（ジョブ）→ 完了後に ZIP をダウンロード
3. ZIP 内に `manifest.json`／CSV／`media/` 画像

## 契約メモ

- `format`: `oshi_collection_export`
- `format_version`: 破壊的変更時のみ上げる
- 各行は `core`（安定）＋ `extra`（スキーマ追加分）
