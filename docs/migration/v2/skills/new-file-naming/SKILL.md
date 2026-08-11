---
name: new-file-naming
description: >-
  新規ファイル・モジュール・API パス・識別子を追加する直前に適用する。
  Next.js + FastAPI monorepo の命名規則と用語集に合わせる。
---

# 新規命名チェック（new-file-naming）

## いつ使うか

- ファイル・ディレクトリを **新規作成**するとき
- ルータ・service・React コンポーネント・env キーを **新設**するとき
- リネームを提案するとき

## 参照（必読）

1. [naming.md](../../../../.cursor/rules/naming.md)（またはリポ内 `.cursor/rules/naming.md`）
2. [glossary.md](../../glossary.md)
3. [file_structure.md](../rules/file_structure.md)（v2）

## チェックリスト（上から）

1. **置き場**: `apps/web` / `apps/api` / `packages/shared` / `supabase` のどれか。ルートに業務コードを増やさない。
2. **ファイル名**:
   - Python: `snake_case.py`、service は `<domain>_service.py`
   - React コンポーネント: `PascalCase.tsx`
   - Next ルート segment: `kebab-case`
   - 禁止: `controller.py`, `*_final.py`, 日本語のコードファイル名
3. **用語**: glossary の「正」。特に:
   - 製品 = `product` / `registration_product`
   - 画像 = `photo`（製品全体を photo と呼ばない）
   - テナント = `members_id`（`owner_id` 禁止）
4. **API**: 複数形リソース、JSON は **snake_case**
5. **env**: Web 公開は `NEXT_PUBLIC_*`。secret を公開プレフィックスに付けない
6. **DB**: 既存物理名を勝手に変えない

## 迷ったとき

- 近い domain の既存ディレクトリに寄せる
- 新 top-level を増やす前に naming.md の表とユーザー確認
- 旧 Dash 名のまま移植するなら **一度にリネームせず**、移植 PR とリネーム PR を分ける

## 自動化

```powershell
python scripts/naming_check.py check-paths path\to\new_file
python scripts/naming_check.py check-staged
```

違反があれば名前を直してからコミットする。
