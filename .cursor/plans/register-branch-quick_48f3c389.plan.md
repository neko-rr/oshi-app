---
name: register-branch-quick
overview: 登録開始前に分岐ページを追加し、グッズ登録（クイック追加/写真・タグ付け）と書籍登録（準備中）を選べるようにします。クイック追加は barcode→photo→写真保存→成功表示→barcodeへ戻る（連続登録）にします。
todos:
  - id: add-register-select-page
    content: "`pages/register/select.py` を新設し、3分岐ボタン（クイック/写真・タグ付け/書籍準備中）と store 更新+遷移を実装する"
    status: completed
  - id: change-register-redirect
    content: "`app.py` の `/register` リダイレクト先を `/register/select` に変更する"
    status: completed
    dependencies:
      - add-register-select-page
  - id: add-meta-to-registration-store
    content: "`components/state_utils.py` に `meta.flow` 等を追加し、`empty_registration_state/ensure_state/serialise_state` で補完する"
    status: completed
  - id: implement-quick-save-service
    content: "`services/registration_service.py` にクイック保存（product_name自動仮名、写真アップロード→product insert）を追加する"
    status: completed
    dependencies:
      - add-meta-to-registration-store
  - id: branch-photo-callback
    content: "`features/photo/controller.py` を `meta.flow` で分岐し、クイック時は保存→/register/barcode戻し、フル時は既存どおりレビュー遷移にする"
    status: completed
    dependencies:
      - implement-quick-save-service
  - id: show-success-on-barcode
    content: "`pages/register/barcode.py` と `features/barcode/controller.py` に成功バナー表示（1回表示で消す）を追加する"
    status: completed
    dependencies:
      - branch-photo-callback
  - id: update-file-structure-doc
    content: "`cursor.md` に `/register/select` 追加・クイック追加導入の変更点を記録する（`.cursor/rules/file_structure.md` は修正禁止のため編集しない）"
    status: completed
    dependencies:
      - add-register-select-page
isProject: false
---

# 登録フロー分岐ページ追加（クイック追加対応）

## ゴール

- `/register/select` に「グッズ登録（クイック追加：写真撮影のみ）」「グッズ登録（写真・タグ付け）」「書籍登録」の分岐UIを追加する。
- 既存の `/register/barcode` → `/register/photo` → `/register/review` は「写真・タグ付け」用として維持する。
- クイック追加は **barcode→photo→写真保存→成功表示→/register/barcode に戻る（連続登録）**。
- 書籍登録は今回は **準備中** 表示のみ（遷移しない/保存しない）。

## 事前に分かった現状（重要）

- `app.py` が `/register` を `/register/barcode` にリダイレクトしているため、分岐ページ導入にはここを変更するのが最小。
- 保存処理は `services/registration_service.py` の `save_registration()` が `product_name` 必須だが、クイック追加はレビューを経由しないため、**product_name 自動仮名**で保存できる専用処理が必要。
- 登録状態は `dcc.Store(id="registration-store")` にあり、`components/state_utils.py` の `empty_registration_state()/ensure_state()` が形を決めている。

## 変更方針（設計）

- `registration-store` に `meta` を追加して、現在の登録モードを保持する。
- 例: `meta.flow` を `goods_quick` / `goods_full` / `book` で管理。
- クイック連続登録のため、クイック保存後に状態を初期化する際も `meta.flow=goods_quick` を維持。
- `/register/select` ページのボタン押下で `registration-store.meta.flow` を更新し、
- `goods_full` / `goods_quick` は `/register/barcode` へ遷移
- `book` は「準備中」を表示
- `features/barcode/controller.py` は基本維持（バーコードはクイックでも任意なのでスキップも許可）。
- `features/photo/controller.py` をモード分岐し、
- `goods_full`: 既存どおり `/register/review` へ
- `goods_quick`: 写真取得後に保存処理を実行し、成功メッセージを保持したうえで `/register/barcode` へ戻す
  - 失敗時は業務エラー/システムエラーを分けて表示（写真未取得は業務エラーで画面に表示、Supabase/IOは例外ログ＋エラーメッセージ）
- **UI/ロジック分離ルール**: `services/` は **Dashの `html` などUI依存を返さない**（純データを返す）。UI表示（成功/失敗メッセージ・バナー）は `features/*/controller.py` が `html.Div` 等を生成して返す。

## 実装ステップ（段階的）

### Step 1: ルーティング追加（分岐ページ）

- 新規ページを追加: `[pages/register/select.py](pages/register/select.py)`
- 3ボタンUI（クイック/写真・タグ付け/書籍）
- 書籍は「準備中」アラートのみ
- `[app.py](app.py)` の `/register` リダイレクト先を `/register/select` に変更

### Step 2: 登録モードを store に保持

- `[components/state_utils.py](components/state_utils.py)`
- `empty_registration_state()` に `meta` を追加
- `ensure_state()` と `serialise_state()` で `meta` を欠損しても補完する

### Step 3: 分岐ページから store 更新 + 遷移

- `/register/select` で `meta.flow` を更新し、`/register/barcode` へ遷移

### Step 4: クイック追加の保存処理を追加

- `[services/registration_service.py](services/registration_service.py)`
- `save_quick_registration(store_data) -> Dict[str, Any]` のような関数を追加（戻り値は `status/message/photo_id/...` 等の純データ）
- `product_name` は自動仮名（例: `未設定_YYYYMMDD_HHMMSS`）
- 写真は `front_photo.original_tmp_path` or `front_photo.content` からアップロードし、`registration_product_information` に登録
- タグは「未登録扱い」＝今回の保存ではタグテーブル更新は行わない（現状のDB設計に合わせて、既存の product insert のみ）

### Step 5: photo コールバックをモード分岐

- `[features/photo/controller.py](features/photo/controller.py)`
- `meta.flow == goods_quick` の場合:
  - 写真未取得のスキップは **業務エラー** として弾く（「写真を撮影してください」）
  - 写真取得後に `save_quick_registration()` を呼ぶ
  - 成功時: `registration-store` を初期化（ただし `meta.flow=goods_quick` 維持）し、成功メッセージを次画面で出せるよう `meta.last_save_message` 等に入れて `/register/barcode` へ遷移

### Step 6: 成功表示（バーコード画面）

- `[pages/register/barcode.py](pages/register/barcode.py)` に成功表示用の `html.Div(id="register-success-banner")` を追加
- `[features/barcode/controller.py](features/barcode/controller.py)` に「ページ到達時に success banner を表示して1回で消す」軽いコールバックを追加

### Step 7: 仕様ドキュメント更新

- `cursor.md` に、`/register/select` 追加と登録フローの変更点を記録する（`.cursor/rules/file_structure.md` は修正禁止のため編集しない）

## 影響ファイル

- 追加: `[pages/register/select.py](pages/register/select.py)`

