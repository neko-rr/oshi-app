# テスト駆動開発（TDD）方針

Apply Mode: Always Apply

## 一言

**振る舞いを先にテストで固定し、実装はそのテストを通すためだけに書く。**  
「動いたら後でテスト」を新規のユースケースでは採用しない。

## Red → Green → Refactor

1. **Red**: 失敗するテストを先に書く（コンパイル・実行できる最小失敗）
2. **Green**: テストを通す最小実装
3. **Refactor**: テスト緑のまま構造を整える（naming.md に合わせる）

1 サイクルは小さく（1 振る舞い / 1 API 契約 / 1 UI 条件）。

## どこにテストを置くか（v2 monorepo）

| 対象 | 置き場 | ランナー |
|------|--------|----------|
| FastAPI ユースケース・ルータ | `apps/api/tests/` | pytest |
| 共有 TS 型・純関数 | `packages/shared` の `*.test.ts` または `__tests__` | vitest（導入後） |
| Next UI の重要フロー | `apps/web` e2e は後段 | Playwright（導入後） |
| DB / RLS | SQL fixture + API 統合テスト（トークン mock） | pytest |

当面 monorepo 骨格前でも、**API ドメインを書くときは先に `tests/` を同じ PR に含める**。

## 必須・任意

| 種別 | 必須？ | 例 |
|------|--------|-----|
| 純関数・バリデーション | 必須 | タグ slot、価格集計 |
| API ハンドラ（認可付き） | 必須 | 401/200、`members_id` isolation |
| 外部 API（楽天等） | mock して必須 | HTTP をスタブ |
| Supabase 実接続 | 任意（CI 秘密なし） | ローカル手動 + skip マーカー |
| 見た目ピクセル | 任意 | 後回し |

## 書き方の規則

- テスト名は **振る舞い** を表す: `test_create_product_rejects_empty_name`
- Arrange / Act / Assert を短く分ける（コメントは日本語で最小）
- 実トークン・実 `.env` 値をテストに埋め込まない（[security.md](security.md)）
- 業務エラーとシステムエラーを分ける既存方針に合わせ、**期待ステータスを先に**書く
- 新規 public 関数は **テストから呼ばれる形**にする（private 内部だけ先に肥大化させない）

## エージェントへの強制

新しい機能・バグ修正を実装するとき:

1. **先に**失敗するテストを追加（または既存を更新）
2. 実装
3. `post-change-verify` / pytest / tsc を実行
4. テストなしの「実装だけ」で終わらせない

例外（テスト不要と明示できるもの）:

- ドキュメント・rules のみ
- コピー文言のみ・設定コメントのみ
- 1 行の型だけなど、実行パスが増えない変更

## 関連

- skill: [tdd-workflow](../skills/tdd-workflow/SKILL.md)
- 変更後検証: [post-change-verify](../skills/post-change-verify/SKILL.md)
- 命名: [naming.md](naming.md)
