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

1. [naming.md](../../rules/naming.md)
2. [glossary.md](../../../docs/migration/v2/glossary.md)
3. [file_structure v2](../../../docs/migration/v2/rules/file_structure.md)

## チェックリスト（上から）

1. **置き場**: `apps/web` / `apps/api` / `packages/shared` / `supabase` のどれか。
2. **ファイル名**: Python は `snake_case`、React は `PascalCase.tsx`、ルート segment は kebab。`controller.py` 禁止。
3. **用語**: glossary。製品=`product`、画像=`photo`、テナント=`members_id`。
4. **API**: 複数形リソース、JSON は snake_case。
5. **env**: Web は `NEXT_PUBLIC_*`。secret を公開しない。
6. **DB**: 物理名を勝手に変えない。

## 自動化

```powershell
python scripts/naming_check.py check-paths path\to\new_file
python scripts/naming_check.py check-staged
```
