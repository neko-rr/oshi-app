# アーキテクチャ優先順位（v2 移行中）

Apply Mode: Always Apply

## 新規コードの正本（優先順）

旧 Dash 用 rules に「修正禁止」がある場合でも、**これから書く Next.js + FastAPI コード**は次を優先する。

1. [naming.md](naming.md) — ファイル名・識別子・JSON
2. [docs/migration/v2/rules/file_structure.md](../../docs/migration/v2/rules/file_structure.md) — monorepo 配置
3. [docs/migration/v2/glossary.md](../../docs/migration/v2/glossary.md) — 用語
4. [auth.md](auth.md) / [security.md](security.md)
5. [docs/migration/v2/rules/api_contract.md](../../docs/migration/v2/rules/api_contract.md)

## 旧ドキュメントの扱い

| ファイル | 役割 |
|----------|------|
| [file_structure.md](file_structure.md) | **Dash 期**のサイトマップ・pages 構成。履歴・未移植機能の参照。**v2 の新規パス設計には使わない** |
| [spec.md](spec.md) | 製品要件（機能の正）。UI フレームワーク記述は読み替え |
| [database_configuration.md](database_configuration.md) | DB 物理名・用語の正（改名はマイグレーション必須） |
| [docs/archive/](../../docs/archive/) | DEPRECATED 手順 |

## エージェント向け一文

**新しいファイルを作る前に naming.md と glossary と v2 file_structure を読む。**  
`controller.py`・巨大 `photo_service`・Flask `OAuth` は新規に増やさない。  
振る舞い変更は [tdd.md](tdd.md) に従いテストを先に書く。
