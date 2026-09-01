<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 法務・ライセンス（入口）

依存ライブラリと外部サービスの **表示・義務** を管理する。

## ファイル

| パス | 更新 | 役割 |
|------|------|------|
| [services.json](services.json) | **手** | 楽天など外部 API の表示メモ |
| [generated/](generated/) | **自動** | NOTICE（md / json） |
| `apps/web/src/data/generated/third_party_notices.json` | **自動** | 公開ページ用（docs と同一） |
| 公開ページ `/licenses` | 実装 | 上記 JSON を表示 |

## 再生成

```powershell
python scripts/generate_third_party_notices.py
python scripts/generate_third_party_notices.py --check
```

依存を増やしたあと・CI 前に実行する。`pnpm install` と API の `pip install` 済みだとライセンス名が埋まりやすい。

## やらないこと

- `generated/` や Web 側 JSON の手編集
- 楽天 LIVE オフのままロゴだけ先に出す（`services.json` の状態を正とする）
