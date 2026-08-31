<!-- 更新: ARCHIVE寄り — 移行メモ。現行正本はルート AGENTS.md と .cursor/rules/*.mdc。凡例: docs/README.md -->
# Cursor プロファイル: Web-Oshi

## なぜ一覧に出なかったか

前回は `storage.json` を直接書き換えて登録しようとしました。  
**Cursor が起動中だと、メモリ上のプロファイル一覧がディスクを上書き**するため、手書きの `Web-Oshi` は UI に出ず消えます。

正攻法は次のどちらかです。

---

## 方法 A（おすすめ・起動したままで可）: Import Profile

1. **Ctrl+Shift+P** を押す  
2. **`Profiles: Import Profile`** を選ぶ  
3. 次のファイルを指定する（**リポジトリルートからの相対パス**）:

```text
.vscode/profiles/Web-Oshi.code-profile
```

4. インポート完了後、**`Profiles: Switch Profile` → `Web-Oshi`**  
5. （任意）このフォルダに固定: 設定から「Apply to this window / folder」

Kaggle-Light も同じ `.code-profile` 形式で作られていました。

---

## 方法 B: Cursor を終了してからスクリプト登録

1. Cursor を**すべて終了**（タスクトレイも）  
2. リポジトリルートで:

```powershell
cd <リポジトリルート>
python scripts\register_web_oshi_profile.py
```

3. 成功メッセージ `OK. Cursor を起動し...` を確認  
4. Cursor を起動 → Profiles に **Web-Oshi**  
5. このワークスペースは自動で Web-Oshi 関連付け（再設定済み）

起動中にスクリプトを実行すると exit code 2 で Import 手順を表示して止まります。

**注意:** ドキュメント・ソースにマシン固有の絶対パス（各 OS のユーザーホーム配下）を書かない（共同開発・GitHub 公開禁止。`secret_guard` が検知する）。

---

## 中身

- 拡張: Python / ESLint / Prettier / Tailwind / Docker / Mermaid プレビュー等（Jupyter / Colab なし）
  - `bierner.markdown-mermaid` … Cursor は VS Code 本体の Mermaid を同梱しないため必須。`Ctrl+Shift+V` で図を確認
- 設定: pytest 有効、TS/Python format on save
- 生成: `python scripts\build_web_oshi_code_profile.py`

## 関連ワークスペース設定

- `.vscode/extensions.json` … 推奨・非推奨拡張  
- `.vscode/settings.json` … pytest 等（プロファイル無しでも効く）
