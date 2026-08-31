<!-- 更新: 自動フォルダの説明 — 中身の生成物は手編集禁止。凡例: docs/README.md -->
# generated（デザイン）

| 出力 | 再生成 | 正本 |
|------|--------|------|
| `gaps.md` | `python scripts/generate_design_docs.py` | page.tsx + `meta/design_adoption.json` + compliance |
| `adoption_status.md` | 同上 | `meta/design_adoption.json` |
| `inventory.json` | 同上 | 機械可読 |
| （icons）`apps/web/src/lib/icons.ts` | `python scripts/sync_design_icons.py` | `meta/icons.json` |
| （icons）`apps/mobile/src/lib/icons.ts` | 同上 | 同上（`lucide-react-native`） |
| （icons）`docs/design/icons.md` 採用表 | 同上 | 同上 |

## 検査（生成ではない）

```powershell
python scripts/check_design_compliance.py
python scripts/check_design_tokens.py
python scripts/sync_design_icons.py --check
```

pnpm: `pnpm generate:design-docs` / `pnpm check:design` / `pnpm check:design-tokens`

**本番 UI は自動では変えない。** Lab 採用は skill `design-adoption`。
