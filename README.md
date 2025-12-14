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

## クイックスタート

### 🚀 自動セットアップ (推奨)

```bash
# 仮想環境作成 & 依存関係インストール & .envファイル作成
python setup.py

# アプリ起動
python app.py
```

### 📋 手動セットアップ

```bash
# 1. 仮想環境作成
python -m venv venv

# 2. 仮想環境有効化
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# 3. 依存関係インストール
pip install -r requirements.txt

# 4. 環境変数ファイル作成 (.env をコピーして設定)
# setup.py を実行すると自動で作成されます

# 5. アプリ起動
python app.py
```

バーコード検出には `zbar` ライブラリが必要です。

- **macOS**: `brew install zbar`
- **Ubuntu/Debian**: `sudo apt-get update && sudo apt-get install libzbar0`
- **Windows**: [ZBar Windows 版](http://zbar.sourceforge.net/) をインストール

### 1. Supabase を使う場合 (任意)

1. [Supabase](https://app.supabase.com/) で無料プロジェクトを作成
2. Storage に Public バケット `photos` を作成
3. データベーステーブルを作成 (Supabase ダッシュボードの SQL Editor で実行)
4. `.env` に以下を設定

```sql
-- 作品シリーズテーブル
CREATE TABLE IF NOT EXISTS works_series (
  works_series_id SERIAL PRIMARY KEY,
  works_series_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 作品情報テーブル
CREATE TABLE IF NOT EXISTS works_information (
  works_id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  works_series_id INTEGER REFERENCES works_series(works_series_id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 版権元テーブル
CREATE TABLE IF NOT EXISTS copyright_source (
  copyright_company_id SERIAL PRIMARY KEY,
  copyright_company_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 製品種別テーブル
CREATE TABLE IF NOT EXISTS product_type (
  product_group_id SERIAL PRIMARY KEY,
  product_group_name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 製品規格サイズテーブル
CREATE TABLE IF NOT EXISTS product_regulations_size (
  product_size_id SERIAL PRIMARY KEY,
  product_group_id INTEGER REFERENCES product_type(product_group_id) ON DELETE SET NULL,
  product_type TEXT NOT NULL,
  product_size_horizontal INTEGER,
  product_size_depth INTEGER,
  product_size_vertical INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 収納場所テーブル
CREATE TABLE IF NOT EXISTS receipt_location (
  receipt_location_id SERIAL PRIMARY KEY,
  receipt_location_name TEXT NOT NULL UNIQUE,
  receipt_location_size_horizontal INTEGER,
  receipt_location_size_depth INTEGER,
  receipt_location_size_vertical INTEGER,
  receipt_count_per_1 INTEGER DEFAULT 1,
  receipt_size_horizontal_per_1 INTEGER,
  receipt_size_depth_per_1 INTEGER,
  receipt_size_vertical_per_1 INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 製品情報テーブル（拡張版）
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 基本情報
  barcode TEXT,
  barcode_type TEXT DEFAULT 'unknown',
  product_name TEXT,
  description TEXT DEFAULT '',

  -- 関連情報
  works_id INTEGER REFERENCES works_information(works_id) ON DELETE SET NULL,
  copyright_company_id INTEGER REFERENCES copyright_source(copyright_company_id) ON DELETE SET NULL,
  product_group_id INTEGER REFERENCES product_type(product_group_id) ON DELETE SET NULL,
  product_size_id INTEGER REFERENCES product_regulations_size(product_size_id) ON DELETE SET NULL,

  -- 画像関連
  image_url TEXT,
  additional_images TEXT[], -- 追加画像URLの配列

  -- タグ関連
  tags TEXT[] DEFAULT '{}',
  custom_tags TEXT[] DEFAULT '{}',

  -- 収納関連
  receipt_location_id INTEGER REFERENCES receipt_location(receipt_location_id) ON DELETE SET NULL,

  -- 価格・数量情報
  price INTEGER,
  quantity INTEGER DEFAULT 1,
  purchase_date DATE,

  -- メモ・備考
  notes TEXT,
  memo TEXT,

  -- タイムスタンプ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Securityの設定とポリシー
ALTER TABLE works_series ENABLE ROW LEVEL SECURITY;
ALTER TABLE works_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE copyright_source ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_regulations_size ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipt_location ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- 全テーブルに共通のRLSポリシー適用
CREATE POLICY "Anyone can view works_series" ON works_series FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert works_series" ON works_series FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update works_series" ON works_series FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete works_series" ON works_series FOR DELETE TO public USING (true);

-- (同様に他のテーブルにもRLSポリシーを適用)

-- インデックスの作成
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_products_tags ON products USING GIN(tags);
```

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

### 写真登録（Dash Pages 3 ステップ）

1. 下部ナビ「📸 写真を登録」をタップ → `/register/barcode`
2. **STEP1 バーコード**: スキャン / 画像アップロード / 手入力（スキップ可）
   - 成功またはスキップで自動的に **STEP2** へ遷移します。
3. **STEP2 正面写真**: 撮影またはアップロード（スキップ可）
   - 成功またはスキップで **STEP3** へ遷移します。
4. **STEP3 確認・登録**: 楽天 API 照合結果と画像説明からのタグ候補を確認し、メモを入力して保存します。Supabase を設定していれば保存されます。

### 登録済み写真を見る

- 「🖼 写真一覧」で登録済みカードを確認
- バーコード・説明を併せて確認

### 設定

- テーマ切替、登録件数確認
- 「全てのデータを削除」で Supabase のデータを一括削除（Supabase 設定時のみ）

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

## 既知の挙動メモ

- ブラウザ拡張（広告/セキュリティ系）が `/_dash-update-component` や Supabase 通信をブロックすると遷移や保存が止まることがあります。問題が出る場合は拡張を一時無効化するか、シークレットウィンドウで確認してください。
- Supabase を未設定でも UI は動作しますが、保存・ギャラリー取得は無効になります。環境変数を設定すると保存が有効になります。

---

## 今後の拡張

- spec.md に記載の: グッズ照合 (楽天 API)、タグ入力補助、SNS シェアなど
- Supabase 以外の DB (Neon / SQLite / Firestore) への抽象化
- 推し色テーマ切替、収納タグ管理など UI コンポーネントの拡充

構造を分離しているので、ドメインロジックを `services/` に追加していくだけで拡張できます。

---

## 🐳 Docker でのデプロイ

### Docker ビルド & 実行

```bash
# 1. 環境変数ファイルを準備
cp .env.example .env
# .envファイルを編集してAPIキーを設定

# 2. Dockerイメージをビルド
docker build -t oshi-app .

# 3. コンテナを実行
docker run -d \
  --name oshi-app \
  -p 8050:8050 \
  --env-file .env \
  oshi-app
```

### Docker Compose での実行（推奨）

```bash
# 1. 環境変数ファイルを準備
cp .env.example .env

# 2. Docker Composeで起動
docker-compose up -d

# 3. ログ確認
docker-compose logs -f app

# 停止
docker-compose down
```

### 環境変数設定

`.env` ファイルを作成し、以下の変数を設定してください：

```bash
# Supabase設定
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# API設定（任意）
IO_INTELLIGENCE_API_KEY=your-io-api-key
RAKUTEN_APP_ID=your-rakuten-app-id

# ポート設定
PORT=8050
```

### Docker イメージの特徴

- **マルチステージビルド**: ビルドサイズを最適化
- **セキュリティ**: 非 root ユーザーで実行
- **ヘルスチェック**: コンテナの健全性を監視
- **最適化設定**: gunicorn のワーカー/スレッドを調整

### 本番環境デプロイ

```bash
# イメージをビルドしてプッシュ
docker build -t your-registry/oshi-app:latest .
docker push your-registry/oshi-app:latest

# docker-compose.prod.yml などで本番設定を使用
```

---

## ライセンス

MIT License
