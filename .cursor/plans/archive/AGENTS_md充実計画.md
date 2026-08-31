---
name: AGENTS.md 充実計画
overview: AGENTS.md をエージェント向けの短い正本に拡張する。詳細仕様は .cursor/rules と DESIGN.md に委譲し、Dash 計測は docs/ の2ファイルへリンクする。将来 Next.js×FastAPI 移行と整合する境界ルールを含める。
todos:
  - id: draft-outline
    content: AGENTS.md の見出し構成（製品一文・現在スタック・移行方針・層分離・データ/認証・デザイン・Dash計測・品質・参照一覧）を確定
  - id: write-agents-md
    content: AGENTS.md を日本語で執筆（spec の複製なし、相対パスリンク中心、docs/2件を参照一覧に含める）
  - id: verify-links
    content: 記載パス（.cursor/rules/*、DESIGN.md、Cursor.md、docs/dash_*.md）がリポジトリ内に存在することを確認
isProject: false
---

# AGENTS.md 充実計画

## 目的

[AGENTS.md](AGENTS.md) は現状2行のみ。Cursor / Codex 等のエージェントが **最初に読むべき境界と参照先** をここに集約し、`.cursor/rules` の詳細仕様や [DESIGN.md](DESIGN.md) の重複を避けつつ、**Dash 期の開発と将来 Next.js×FastAPI 移行**の両方に効く原則を短く書く。

## 役割の切り分け

| ドキュメント | 役割 |
|-------------|------|
| AGENTS.md | 常に守るルール・層境界・秘密情報・参照先リンク。**本文は肥大化させない。** |
| [.cursor/rules/spec.md](.cursor/rules/spec.md) | 製品仕様・機能要件・登録フロー等の詳細正本（リポジトリ方針上の修正禁止あり）。AGENTS からはリンクのみ。 |
| [.cursor/rules/file_structure.md](.cursor/rules/file_structure.md) | URL・ディレクトリ・Dash Pages 制約の正本。 |
| [.cursor/rules/database_configuration.md](.cursor/rules/database_configuration.md) | スキーマ・テーブル用語の正本。 |
| [.cursor/rules/OAuth.md](.cursor/rules/OAuth.md) | 認証・環境変数・デプロイ手順の正本。 |
| [DESIGN.md](DESIGN.md) | デザインシステムの正本。 |
| [Cursor.md](Cursor.md) | 運用メモ・計測シナリオ・PR レビュー観点（セキュリティゲート等）。 |
| [docs/dash_callback_baseline.md](docs/dash_callback_baseline.md) | `/_dash-update-component` の計測手順・ベースライン。 |
| [docs/dash_initial_callbacks_inventory.md](docs/dash_initial_callbacks_inventory.md) | 初回発火コールバックの棚卸し表。 |

**方針**: `docs/` の2ファイルは **AGENTS に全文を載せない**。参照一覧に **必須ではなく「コールバック統合・表示速度・POST 削減を触るときは読む」** としてリンクする（[Cursor.md](Cursor.md) と重複する場合は AGENTS 側は1行にまとめ、詳細は Cursor または docs へ誘導してよい）。

## AGENTS.md に書くセクション（執筆時の目安）

1. **このファイルの役割** — エージェント向けの入口であること、詳細は下記リンクへ。
2. **プロダクト一文** — 推し活グッズ管理の要約（1〜2文）。詳細は spec へ。
3. **現在の技術スタック** — Flask + Dash Pages、dbc、Bootswatch、Supabase、Render。起動は `python server.py` 等は OAuth.md / README に委譲可。
4. **将来（Next.js × FastAPI）** — UI は Next、API は FastAPI、Auth/DB は Supabase 継続の想定を1段落。いまから **`services/` にドメインを寄せ、コールバックは薄く** と書く（移行コスト低減）。
5. **コード配置** — `pages/` / `features/*/controller.py` / `services/` / `components/` / `assets/`。file_structure.md へのリンク。
6. **データ・RLS・Storage** — `members_id` と RLS、Private Storage + object path は原則のみ。database_configuration と file_structure の Storage 節へリンク。
7. **認証・秘密情報** — `.env` を Git に含めない、本番ログにトークン・ストア全文・画像を出さない等。OAuth.md と Cursor.md のセキュリティ観点へリンク。
8. **デザイン** — [DESIGN.md](DESIGN.md) に従う（既存2行を維持・必要なら `assets/styles.css` とトークン方針を1文）。
9. **Dash 表示速度・コールバック** — 変更前後の比較や棚卸しを行うときは次を参照する旨を明記:
   - [docs/dash_callback_baseline.md](docs/dash_callback_baseline.md)
   - [docs/dash_initial_callbacks_inventory.md](docs/dash_initial_callbacks_inventory.md)
   - 補足として [Cursor.md](Cursor.md) の計測・PR 観点セクションへのリンク（重複を避けるなら「詳細は Cursor.md」1行）。
10. **品質** — 依頼範囲に留める、業務エラーとシステムエラーの区別などはユーザー方針と整合する1〜2文でよい。
11. **参照一覧（箇条書き）** — 上表のパスをすべて列挙。

## 実装時の注意

- `.cursor/rules` 内の「修正禁止」ファイルは **編集しない**。
- AGENTS.md のパスは **リポジトリルートからの相対パス**（例: `.cursor/rules/spec.md`）で統一する。
- DESIGN.md のバージョン番号は AGENTS に固定で書かず「最新の DESIGN.md に従う」でよい。

## 完了条件

- AGENTS.md のみで **どこにコードを書くか・何を壊してはいけないか・どこを読めば足りるか** が分かる。
- **docs/dash_callback_baseline.md** と **docs/dash_initial_callbacks_inventory.md** が参照一覧に含まれている（全文転載はしない）。
- Dash 前提と Next/FastAPI 移行の両方が短くつながっている。
