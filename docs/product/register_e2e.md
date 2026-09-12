<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 登録の自動テスト（フィクスチャ）

バーコード用画像と正面写真を **別ファイル** として置き、参照先がずれていないかを機械が確認する。  
実商品の写真は Git / CI に入れない（手元の手動確認用）。

## 層

| 層 | 何を見るか | 実行 |
|----|------------|------|
| L0 | 認証スタブ・優先順位などのユニット | `pnpm -C apps/web test:register-contract` の一部 |
| L1 | `manifest.json` 契約 + **ZXing** で合成バーコードを読む | `pnpm -C apps/web test:register-contract` |
| L2 | ウィザード（ゲストゲート / 本登録 stub + API mock） | `pnpm -C apps/web test:register-e2e` |
| L3 | 実 IO / 楽天 | **CI に載せない**（手元の LIVE フラグのみ） |

Mobile（Expo）E2E は未着手。契約は「デコード入出力 + API シーケンス」。DOM / Playwright は Web 専用。

## フィクスチャ

場所: `apps/web/e2e/fixtures/register/`

- `manifest.json`（必須。欠落は fail）
- `barcode_product_a.png` … 合成 QR（製品 A の番号）
- `front_product_b.png` … 合成の単色正面（製品 B）
- `unreadable.png` … バーコード無し（読取失敗用）

再生成: `pnpm -C apps/web generate:register-fixtures`

実写・顔・部屋・API キー・署名 URL を置いてはいけない。

## 認証スタブ（Secrets なし）

| 変数 | どこ | 意味 |
|------|------|------|
| `NEXT_PUBLIC_E2E_AUTH_STUB_ENABLED=1` | CI の register-e2e ビルド / ローカル dev | クライアントが Cookie を stub として読む |
| `E2E_AUTH_STUB_ENABLED=1` | 同ジョブの `next start` / dev | middleware がログイン Redirect をスキップ |
| Cookie `oshi_e2e_auth` | Playwright が付与 | `guest` または `permanent` |

**Cloudflare / Render には置かない。** 本線の `next build`（通常 CI）にも付けない。

## L2 が緑なら保証する受け入れ（閉集合）

- バーコードを画像から読める
- 読めない画像では失敗案内＋番号入力欄が残る
- 正面写真の直後プレビュー
- 正面をスキップしても名前だけで本保存できる（`/photos` なし）
- ゲストは照合・正面の次へ（Assist）・本保存の API に届かない（ゲート）
- 本登録相当（stub）では `/photos` に **正面だけ** が載る（バーコード画像は製品写真にしない）
- アシストは mock。実キー不要

入れない: 続けて登録の中身、全部消す、楽天キーワード、カメラライブ、LIVE 外部 API。

## ローカル実行

```powershell
pnpm -C apps/web test:register-contract

# L2 は next start（dev/turbopack はロケール Redirect で不安定）
$env:NEXT_PUBLIC_E2E_AUTH_STUB_ENABLED = "1"
$env:E2E_AUTH_STUB_ENABLED = "1"
$env:NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co"
$env:NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder"
$env:NEXT_PUBLIC_API_BASE_URL = "http://127.0.0.1:8000"
pnpm build:shared
pnpm build:web
pnpm -C apps/web test:register-e2e
```

L2 は既定で `localhost:3010` に `next start` する（日常の :3000 とぶつからない）。
スタブ用 `NEXT_PUBLIC_*` は **ビルド時** に焼く。通常の本番 `next build` には付けない。
