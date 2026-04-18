---
name: pytestと変更時Skill
overview: pytest を [requirements.txt](requirements.txt) に追加し、リポジトリルートでの venv・pip・pytest の手順を文書化する。続けて `.cursor/skills/post-change-verify/SKILL.md` で変更後検証を固定する。
todos:
  - id: add-pytest
    content: "requirements.txt に pytest（任意: pytest-cov）を追記"
    status: completed
  - id: skill-md
    content: .cursor/skills/post-change-verify/SKILL.md を作成
    status: completed
  - id: verify
    content: venv で pip install -r requirements.txt と python -m pytest tests/ を確認
    status: completed
  - id: optional-ini-agents
    content: "任意: pytest.ini / AGENTS.md の1行"
    status: completed
isProject: false
---

# pytest を requirements.txt に含め、実行場所を明文化する

## 結論

- **pytest は一般的**で、チームで同じコマンドを再現するなら **`requirements.txt` に書くのは妥当**です（ユーザー希望どおりメインの依存に含める）。
- 計画の正本をワークスペースに置きました: [.cursor/plans/変更時テストskillとpytest導入.md](.cursor/plans/変更時テストskillとpytest導入.md)（初心者向け「どのファイル・どのディレクトリ・どのコマンド」あり）。

## 実装フェーズで行うこと（承認後）

1. **[requirements.txt](requirements.txt)** の `# Utilities` 付近に `pytest>=8.0.0`（任意で `pytest-cov`）を追記。
2. **ルート**で `.\.venv\Scripts\Activate.ps1` → `pip install -r requirements.txt` → `python -m pytest tests/ -q`（[Cursor.md](Cursor.md) の venv 手順と整合）。
3. **Skill**: `.cursor/skills/post-change-verify/SKILL.md` を新設し、変更種別ごとに `compileall` / `pytest` の順と除外ルール・秘密情報方針を日本語で記載。
4. **任意**: [AGENTS.md](AGENTS.md) に Skill への1行、[pytest.ini](pytest.ini)（`testpaths` 等）はテストが必要なら最小追加。

## 注意

- `requirements.txt` をそのまま本番 Docker に使う場合、**イメージに pytest も入る**（容量わずか増）。許容できなければ将来 `requirements-dev.txt` に分離可能（現方針はメインに含める）。
- 既存の一部テストは **assert が弱く常に成功に見える**箇所があるため、Skill では「緑＝品質保証ではない」旨を注記可能。
