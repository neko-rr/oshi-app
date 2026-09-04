<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# v2 移行ステータス（2026-09-03）

Dash → **Next.js Web + FastAPI + Supabase** への移行状況。  
詳細の機械可読版は [meta/feature_status.json](meta/feature_status.json)。人間向け一覧は [roadmap.md](roadmap.md)。

## 結論

**Must の本線（登録・一覧・詳細・設定・認証・楽天照合）は一通り使える（ほぼ移行完了）。**  
残作業は Must の磨き（レスポンシブ）、Phase 2、モバイル本番、Later（deferred）である。

| 層 | 状態 |
|----|------|
| 基盤（Auth / JWKS / RLS / Storage photos） | 完了 |
| Must 本線 Web | **ほぼ完了（shipped 中心）** |
| Must 磨き | responsive が partial |
| Phase 2 | dashboard 入口のみ。他は planned |
| Later | deferred（要求待ち。推し色の課金適用は `premium`） |
| Expo モバイル | 枠・デザイン契約のみ（機能未） |

## Must の残り（意図的に partial）

| ID | 残りの内容 |
|----|------------|
| `responsive_web` | 小画面ナビ等の磨き（使えるが体系監査は未） |

登録の「店頭専用画面」「写真ライブプレビュー」「一括 / CLIP / 連続モード」は **Must 本線外の後続**（flows に未実装として記載）。

## やらないこと（この時点）

- `deferred` ルートの勝手追加
- ARCHIVE / Dash UI の再現を正にすること
- モバイル本実装を Must 完了扱いにすること

更新したら: `python scripts/generate_product_docs.py` → [generated/gaps.md](generated/gaps.md) を確認。
