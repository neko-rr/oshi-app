---
name: design-feedback
description: デザイン要望・違和感の inbox / pending / 採用反映。UI 変更前後、Lab 前後、ユーザーが「気になる」と言ったとき。
---

# design-feedback

デザイン要望を **pending のまま蓄積**し、人が **accepted / deferred / rejected** したあとだけ `docs/design/` にルール化する。

## いつ使う

- ユーザーが UI・部品・推し色・動きの **要望 / 違和感** を言ったとき  
- Design Lab 比較のあと「どれ採用？」が **未決** のとき  
- `design-change` / `design-lab` の **前**（pending を読む）と **後**（新規 pending を記録）

## 正本

| 用途 | パス |
|------|------|
| 人の走り書き | `docs/design/feedback/inbox.md` |
| 決定履歴 | `docs/design/feedback/decisions.md` |
| 構造化 | `docs/design/meta/feedback_items.json` |
| 部品・アイコン | `docs/design/components.md` / `icons.md` / **`meta/icons.json`** |

## フロー

```
要望 / 違和感
  → inbox.md（任意）+ feedback_items.json（status: pending）
  → 人: accepted | deferred | rejected
  → accepted のみ: docs/design 更新 + decisions.md 1行
  → 実装: design-change（Lab 比較は design-lab）
```

## エージェント命令

### 記録（新規要望）

1. `feedback_items.json` に1件追加（`id`: `fb-NNN` 連番、`status`: **`pending`**）  
2. フィールド: `created_at`, `source`, `area`, `request_ja`, `agent_note`, `target_docs`, `lab_ref`（任意）  
3. ユーザー向けに「**未決のまま残した。あとで採用/後回し/却下を言ってください**」と伝える  
4. **pending を accepted にしない。** 本番 UI をその場で変えない（明示の実装依頼が別にある場合は `design-change`）

### 着手前（design-change / design-lab）

1. `feedback_items.json` の `pending` を読む  
2. 関連画面なら Lab 案や components に触れるが、**accepted 以外を本番反映しない**

### 採用後（人が accepted と明示）— アイコン追加含む

1. `status` → `accepted`  
2. アイコンなら **`docs/design/meta/icons.json`** に追加 → `python scripts/sync_design_icons.py`  
3. その他は `target_docs` を **1〜数行** 更新  
4. `decisions.md` に1行  
5. 実装が必要なら **`design-change`** を続ける

### deferred / rejected

- JSON の status だけ更新。decisions には書かない（README 参照）

## JSON 例

```json
{
  "id": "fb-001",
  "status": "pending",
  "created_at": "2026-08-31",
  "source": "user",
  "area": "components/button",
  "request_ja": "主ボタンをもう少し柔らかく",
  "agent_note": "Lab B の角丸に近い。未決",
  "target_docs": ["components.md"],
  "lab_ref": "B"
}
```

## 禁止

- pending を勝手に accepted  
- 一覧外アイコンを追加使用（`icons.json` → sync 先）  
- shadcn を捨てて全面自前 UI  
- カラータグと推し色の統合  

## 関連 skill

- 比較: `design-lab`  
- 本番反映: `design-change`  
- 完了後: `post-change-verify`（コードを触った場合）
