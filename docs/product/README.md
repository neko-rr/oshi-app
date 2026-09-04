<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# 製品仕様（エージェント・人間の入口）

**更新区分の凡例（全体）:** [docs/README.md](../README.md)  
製品の「やりたいこと」と「いまコードにあること」を分ける。  
DB の `docs/db/` と同じ二層。**Spec Kit は使わない。**

## ファイルマップ

| ファイル | 役割 | 更新 |
|----------|------|------|
| [value.md](value.md) | 顧客価値・非交渉 | **手** |
| [roadmap.md](roadmap.md) | Must / Phase2 / Later | **手** |
| [v2_status.md](v2_status.md) | v2 移行の要約（ほぼ完了の境界） | **手** |
| [flows/](flows/) | 主要ユーザーフロー | **手** |
| [acceptance/](acceptance/) | 画面ごとの受け入れ条件（DoD） | **手** |
| [i18n.md](i18n.md) | Web 多言語（next-intl・`/en`） | **手** |
| [i18n_glossary.md](i18n_glossary.md) | 翻訳用語集（推し活・製品語） | **手** |
| [i18n_legal_en.md](i18n_legal_en.md) | 法務英語レビューの流れ（個人開発） | **手** |
| [meta/status_vocabulary.md](meta/status_vocabulary.md) | shipped/partial/… の定義 | **手** |
| [meta/feature_status.json](meta/feature_status.json) | 機能 ID → status / expected paths | **エージェント**（承認後） |
| [generated/](generated/README.md) | ルート・API・OpenAPI・gaps | **自動** |

## 読む順（あなた向け）

1. [value.md](value.md) … 何のためのアプリか  
2. [v2_status.md](v2_status.md) … 移行はどこまで終わったか  
3. [roadmap.md](roadmap.md) … 今やる／後でやる  
4. [flows/register.md](flows/register.md) … 登録の理想フロー  
5. [acceptance/](acceptance/) … できているかの短冊  
6. [generated/](generated/) … **いま実装されている事実**（手で直さない）

## ステータス語彙（要約）

詳細は [meta/status_vocabulary.md](meta/status_vocabulary.md)。

| 語 | 一言 |
|----|------|
| `shipped` | 一通り使える（入口だけは不可） |
| `partial` | 入口あり・未完成 |
| `planned` | やる予定・未着手寄り |
| `deferred` | 要求されるまでやらない |

## 自動更新

画面・API・サービス構成が変わったら:

```powershell
python scripts/generate_product_docs.py
```

エージェントは skill **`product-spec-sync`** を実行する。

## やらないこと

- `generated/` を手編集する
- ARCHIVE を新規設計の正にする
- Spec Kit を導入する
- `deferred` なのにルートを勝手に足す
