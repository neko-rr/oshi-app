<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# ステータス語彙（正）

`meta/feature_status.json` と `roadmap.md` で使う語。これ以外を増やさない。

| 語 | 意味 | 使ってよいとき | 使ってはいけないとき |
|----|------|----------------|----------------------|
| `shipped` | 一通り使える | 主要経路が通る・受け入れ条件の大半を満たす | 入口ページだけのとき |
| `partial` | 入口あり・未完成 | 画面/API があるがフロー・品質が未達 | コードが全く無いとき |
| `planned` | やる予定 | roadmap に載せており、未着手または設計のみ | すでにルートがあるのに放置するとき（`partial` へ） |
| `deferred` | 要求されるまでやらない | 明示的に後回し | 実装を始めたあと（`partial`/`shipped` へ上げる） |

## expected_* の意味

| フィールド | 意味 |
|------------|------|
| `evidence_paths` | 実装の根拠ファイル（存在必須。`shipped`/`partial`） |
| `expected_web_paths` | as-built Web にあってほしい path（`[param]` 可） |
| `expected_api_paths` | as-built API にあってほしい path（`{param}` 可） |

- `shipped` / `partial`: expected が as-built に無い → `gaps.md` で警告
- `planned` / `deferred`: expected が as-built に**ある** → 勝手実装の疑い

## 変更手順

1. 語彙に合う status を選ぶ  
2. evidence / expected を更新  
3. `python scripts/generate_product_docs.py`  
4. `generated/gaps.md` が許容できるか確認  
