# 現在のファイルを読み込み
with open('C:\\Users\\ryone\\Desktop\\20251030oshi-app\\app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 'return html.Div(f"保存中にエラーが発生しました: {str(e)}", className="alert alert-danger")' の後のすべてを削除
marker = 'return html.Div(f"保存中にエラーが発生しました: {str(e)}", className="alert alert-danger")'
if marker in content:
    index = content.find(marker) + len(marker)
    new_content = content[:index].rstrip() + '\n'

    # ファイルを書き込み
    with open('C:\\Users\\ryone\\Desktop\\20251030oshi-app\\app.py', 'w', encoding='utf-8') as f:
        f.write(new_content)

    print('Successfully removed old code after save_registration function')
else:
    print('Marker not found')
    print('Content length:', len(content))
    print('Marker in content:', marker in content)
