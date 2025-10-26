# 📦 推し活グッズ管理アプリ

推し活で手に入れたグッズを、スマホだけでサクッと登録・検索できるモバイル向け Web アプリです。バーコードまたは写真を読み取るだけで、自動的にタグ付け・保存。収納場所管理や交換投稿など、推し活をもっと快適にする拡張ができる構成になっています。

## こんな方におすすめ

- グッズの写真とバーコードをまとめて整理したい
- ハッカソンやイベントで短期間に動くデモを作りたい
- Supabase のような BaaS を使った簡易 DB で十分
- 将来的に React / Next.js / Flutter などへ UI を差し替えたい

---

## 特長まとめ

- 📸 **写真アップロード & バーコード自動検出** (pyzbar + Pillow)
- 🤳 **ブラウザカメラからリアルタイム撮影** (getUserMedia)
- 🗂 **Supabase Storage / Database と連携** (未設定でも UI 動作)
- 🖼 **登録済み写真ギャラリー** / 作成日時順で表示
- ⚙️ **データ管理** (全削除ボタン / 将来のタグ管理に拡張可)
- 🎨 **推し色を意識したピンク系 UI** / スマホ最適化済み

将来的にフレームワークを切り替えやすいように、UI とロジックを完全分離してあります。`services/` を差し替えるだけで、別 DB や別 API に移行できます。

---

## クイックスタート (ハッカソン仕様)

```bash
python -m venv .venv
. .venv/Scripts/activate   # PowerShell の場合
pip install -r requirements.txt
```

バーコード検出には `zbar` ライブラリが必要です。

- **macOS**: `brew install zbar`
- **Ubuntu/Debian**: `sudo apt-get update && sudo apt-get install libzbar0`
- **Windows**: [ZBar Windows 版](http://zbar.sourceforge.net/) をインストール

### 1. Supabase を使う場合 (任意)

1. [Supabase](https://app.supabase.com/) で無料プロジェクトを作成
2. Storage に Public バケット `photos` を作成
3. `photos` テーブルを作成 (必要なら `supabase/migrations` を参照)
4. `.env` に以下を設定

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

> Supabase を設定しなくても UI は起動します。保存機能が無効になるだけなので、ハッカソンの早い開発・デモにも向いています。

### 2. アプリを起動

```bash
python app.py
```

- ブラウザ: `http://localhost:8050`
- スマホ: `http://[PCのIPアドレス]:8050`

---

## 使い方

### 写真登録

1. 下部ナビの「📸 写真を登録」をタップ
2. **STEP1**: バーコードを読み取る / 画像をアップロードする / 番号を手入力する（スキップも可能）
3. **STEP2**: グッズの正面写真を撮影またはアップロード（こちらもスキップ可能）
4. **STEP3**: 楽天 API と画像説明から推定されたタグ候補を確認（未設定の場合は後で追加可能）
5. メモを入力して「保存して登録を完了」を押すと Supabase に保存されます（設定済みの場合）

### 登録済み写真を見る

- 「🖼 写真一覧」でカード表示
- バーコードと説明を確認

### 設定

- 登録件数を確認
- 「全てのデータを削除」で Supabase のデータをワンクリック削除

---

## ディレクトリ構成 (転職アピール用にクリーンアーキテクチャ風)

```
.
├── app.py                     # Dash のエントリーポイント。UI/サービスを結線。
├── assets/
│   ├── styles.css             # 共通スタイル (Dash が自動読込)
│   └── camera.js              # getUserMedia によるカメラ制御
├── components/
│   ├── layout.py              # 画面全体レイアウトとナビゲーション
│   ├── upload_section.py      # 写真登録 UI (フォーム + カメラパネル)
│   └── pages/                 # 各ページのプレゼンテーションレイヤー
├── services/
│   ├── supabase_client.py     # Supabase 接続ファクトリ (未設定時は graceful degrade)
│   ├── barcode_service.py     # 画像 → バーコード抽出
│   └── photo_service.py       # 画像ストレージ・DB への CRUD
├── data/products.json         # 将来のタグ・商品データ格納先プレースホルダー
├── supabase/                  # テーブル・バケット作成用 SQL 等
├── Cursor.md                  # 開発者向けメモ (この構成にした背景など)
├── spec.md                    # 上位仕様書 (編集禁止)
└── requirements.txt
```

- **UI 層**: `components/`
- **サービス層**: `services/`
- **資産**: `assets/`
- **データ**: `data/`

将来的に FastAPI + React などへ移行する際は、`services/` をそのまま API に移植し、`components/` をフロントエンド実装に読み替えるだけで活用できます。

---

## カメラ & バーコードフロー

1. `camera.js` が `navigator.mediaDevices.getUserMedia()` でカメラを起動
2. 撮影 → Canvas → JPEG Blob → `dcc.Upload` へ転送
3. Dash コールバックで `services.barcode_service.decode_from_base64()` を実行
4. プレビューとバーコード情報を表示し、`photo_service.insert_photo_record()` で Supabase に保存

Supabase を使わない場合でも、バーコード解析とプレビューまではローカルで完結します。ハッカソンでバックエンドが間に合わなくても UI/UX の確認が可能です。

---

## 今後の拡張

- spec.md に記載の: グッズ照合 (楽天 API)、タグ入力補助、SNS シェアなど
- Supabase 以外の DB (Neon / SQLite / Firestore) への抽象化
- 推し色テーマ切替、収納タグ管理など UI コンポーネントの拡充

構造を分離しているので、ドメインロジックを `services/` に追加していくだけで拡張できます。

---

## ライセンス

MIT License
