<!-- 更新: 手 — 人が書いて直す。凡例: docs/README.md -->
# meta（デザイン）

**凡例:** [docs/README.md](../../README.md)

| ファイル | 役割 | 更新 |
|----------|------|------|
| [icons.json](icons.json) | 採用 lucide 一覧（**正本**） | **エージェント**（承認後） |
| [tokens.json](tokens.json) | セマンティック・トークン名（**正本・check のみ**） | **エージェント**（承認後） |
| [design_adoption.json](design_adoption.json) | Lab 案の本番採用状態 | **エージェント**（承認後） |
| [feedback_items.json](feedback_items.json) | フィードバック ID → status / 要望 / 反映先 | **エージェント**（承認後） |

## icons.json → 自動同期

```powershell
python scripts/sync_design_icons.py
```

| 生成先 | 手編集 |
|--------|--------|
| `apps/web/src/lib/icons.ts` | **禁止** |
| `apps/mobile/src/lib/icons.ts` | **禁止**（Expo 着手前の枠） |
| `docs/design/icons.md`（AUTO マーカー内の表） | **禁止** |

## tokens.json → 検査のみ（値は生成しない）

```powershell
python scripts/check_design_tokens.py
```

`colors.css` / `tailwind-theme.css` に **required 名があるか** を見る。`#9f606c` スケール生成は後回し。

## design_adoption.json

- 語彙・手順: skill **`design-adoption`**  
- Lab 本決定後に画面単位で `lab_variant` / `status` を更新  
- 一覧の再生成: `python scripts/generate_design_docs.py` → `generated/gaps.md`

## エージェント向け

- status 語彙: [feedback/README.md](../feedback/README.md)  
- **pending のまま本番 UI を変えるな**  
- **accepted** は人の明示後のみ。反映後 [decisions.md](../feedback/decisions.md) に1行  
- アイコン追加: `icons.json` 更新 → **必ず sync**  
- a11y: skill **`design-a11y`** + [a11y.md](../a11y.md)  
- モバイル: skill **`design-mobile`**  
- skill: **`design-feedback`** → 比較 **`design-lab`** → 本番 **`design-adoption`** / 一般 **`design-change`**
