---
name: tdd-workflow
description: >-
  機能追加・バグ修正・API 追加の実装を始める前に適用する。
  Red-Green-Refactor で失敗するテストを先に書く。
---

# TDD ワークフロー

## いつ使うか

- ユースケース / ルータ / バリデーション / バグ修正
- 「実装してからテスト」と言いそうなとき（先にこの skill）

## 手順

### 1. 仕様を1文に

例: 「未ログインで GET /products は 401」

### 2. Red — 失敗するテスト

- API: `apps/api/tests/test_<domain>.py` に追加
- 実行: `python -m pytest apps/api/tests/test_<domain>.py -q`（パスは monorepo に合わせる）
- **失敗することを確認**してから実装に進む

### 3. Green — 最小実装

- naming.md / auth.md / api_contract に従う
- テスト以外を通すための余計な機能を足さない

### 4. Refactor

- 重複削除、名前整理
- 再度 pytest が緑であること

### 5. 検証 skill

- [post-change-verify](../post-change-verify/SKILL.md) を実行

## 禁止

- テストなしで production コードだけ追加して完了扱い
- 実 JWT / API キーをテストにハードコード
- 「後でテストを書く」だけで PR 相当の変更を閉じる

## 秘密情報

失敗ログにトークンを出さない（security.md）。
