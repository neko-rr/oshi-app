# Cursor プロファイル: Web-Oshi

## なぜ一覧に出なかったか

前回は `storage.json` を直接書き換えて登録しようとしました。  
**Cursor が起動中だと、メモリ上のプロファイル一覧がディスクを上書き**するため、手書きの `Web-Oshi` は UI に出ず消えます。

正攻法は次のどちらかです。

---

## 方法 A（おすすめ・起動したままで可）: Import Profile

1. **Ctrl+Shift+P** を押す  
2. **`Profiles: Import Profile`** を選ぶ  
3. 次のファイルを指定する:

```text
c:\Users\ryone\Desktop\oshi_app\.vscode\profiles\Web-Oshi.code-profile
```

4. インポート完了後、**`Profiles: Switch Profile` → `Web-Oshi`**  
5. （任意）このフォルダに固定: 設定から「Apply to this window / folder」

Kaggle-Light も同じ `.code-profile` 形式で作られていました。

---

## 方法 B: Cursor を終了してからスクリプト登録

1. Cursor を**すべて終了**（タスクトレイも）  
2. PowerShell:

```powershell
cd c:\Users\ryone\Desktop\oshi_app
python scripts\register_web_oshi_profile.py
```

3. 成功メッセージ `OK. Cursor を起動し...` を確認  
4. Cursor を起動 → Profiles に **Web-Oshi**  
5. `oshi_app` は自動で Web-Oshi 関連付け（再設定済み）

起動中にスクリプトを実行すると exit code 2 で Import 手順を表示して止まります。

---

## 中身

- 拡張: Python / ESLint / Prettier / Tailwind / Docker 等（Jupyter / Colab なし）
- 設定: pytest 有効、TS/Python format on save
- 生成: `python scripts\build_web_oshi_code_profile.py`

## 関連ワークスペース設定

- `.vscode/extensions.json` … 推奨・非推奨拡張  
- `.vscode/settings.json` … pytest 等（プロファイル無しでも効く）
