---
name: 変更時テストSkillとpytest導入
overview: Cursor Skill（変更後の検証手順）を追加し、pytest を requirements.txt に固定して誰でも同じコマンドでテストできるようにする。初心者向けに「どのファイルを触るか」「どこでどのコマンドを打つか」を明記する。
todos:
  - id: add-pytest-req
    content: requirements.txt に pytest（必要なら pytest-cov）を追記
  - id: install-verify
    content: .venv で pip install -r requirements.txt と python -m pytest tests/ を実行し通過または既知失敗を記録
  - id: optional-pytest-ini
    content: （任意）pytest.ini で pythonpath や markers を最小定義
  - id: skill-skill-md
    content: .cursor/skills/post-change-verify/SKILL.md を作成（実行順・除外・秘密情報）
  - id: optional-agents-link
    content: （任意）AGENTS.md に Skill と tests への1行
isProject: false
---

# 変更時テスト Skill ＋ pytest を requirements.txt に含める計画

## 方針の更新（ユーザー要望）

- **pytest は [requirements.txt](requirements.txt) に含める**（開発用に別ファイルだけに分けない）。チーム・CI・本番用 Docker が同じファイルを読む場合でも、pytest は依存が軽く、**「pip install 一発でテストも回せる」**メリットを優先する。
- 併せて **Cursor Skill** で「コード変更のたびに何を実行するか」をエージェントに固定する（前計画どおり）。

## 何処で何をすればよいか（初心者向け）

### 1. リポジトリのルートを開く

- フォルダ: `c:\Users\ryone\Desktop\oshi-app`（`requirements.txt` がある階層）。

### 2. `requirements.txt` を編集する

- **場所**: ファイル [requirements.txt](requirements.txt) の末尾付近（例: `# Utilities` セクションの下）。
- **追記例**（バージョンはプロジェクトで合意したら固定してよい）:

```text
# Testing
pytest>=8.0.0
```

- （任意）カバレッジまで欲しければ `pytest-cov>=5.0.0` も同じブロックに追加。

### 3. 仮想環境で依存を入れ直す

- **場所**: PowerShell で **必ずリポジトリルート**に `cd` した状態。
- **手順**（[Cursor.md](Cursor.md) と同様）:

```powershell
cd C:\Users\ryone\Desktop\oshi-app
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

- 初回のみ `.venv` が無い場合は `python -m venv .venv` から。

### 4. テストを実行する

- **場所**: 同じくルート（`tests/` が見えるディレクトリ）。
- **コマンド**:

```powershell
python -m pytest tests/ -q
```

- 失敗したら、表示されたファイル名と行から原因を追う。エージェントに任せる場合は「`pytest tests/` の失敗を直して」と依頼すればよい。

### 5. Skill を置く場所（実装フェーズ）

- **場所**: `.cursor/skills/post-change-verify/SKILL.md`（フォルダ `post-change-verify` は英小文字・ハイフン。名前は変更可）。
- **中身の要点**（前計画と同じ）:
  - `services/` / `features/` / `pages/` 等を変更したら `compileall` → `pytest tests/` の順。
  - ドキュメントのみの変更はスキップ可。
  - ログにトークンを出さない（[AGENTS.md](AGENTS.md) 整合）。

### 6. （任意）`pytest.ini` をルートに置く

- **場所**: `pytest.ini`（リポジトリルート）。
- **用途**: 最低限 `testpaths = tests` や `pythonpath = .`（`import app` 等が必要なテスト向け）を書く。既存テストが通るまで**必須ではない**。

## 注意（requirements.txt に pytest を入れた場合）

- **Render / Docker** が `requirements.txt` だけでイメージを作っている場合、本番イメージにも pytest が入る（容量はわずかに増える）。問題なければこのまま。分離したくなったら後から `requirements-dev.txt` に移すことは可能。

## 既存テストとのギャップ（計画に含める認識）

- [tests/test_schema.py](tests/test_schema.py) などは **assert が弱い／print 中心**の箇所がある。[tests/test_save.py](tests/test_save.py) は **assert がない**行がある。pytest は「収集して実行」はするが、**失敗として検知されない**テストがある得る。
- **本計画の範囲**: まずは **pytest を依存に入れ、Skill で毎回 `pytest tests/` を回す**ところまで。テスト本体の強化は別タスクでよい（Skill に「偽陽性（常に成功）のテストがあること」を注記してもよい）。

## 完了条件

- [requirements.txt](requirements.txt) に `pytest` が記載されている。
- ルートで `python -m pytest tests/` が再現手順として動く（失敗は別途修正タスク）。
- `.cursor/skills/.../SKILL.md` が存在し、変更後の検証手順が書かれている。
