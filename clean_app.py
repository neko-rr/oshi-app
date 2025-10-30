# app.pyを1050行目までで切り詰めてapp.run()を追加
with open('C:\\Users\\ryone\\Desktop\\20251030oshi-app\\app.py', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# 1050行目までを保持
truncated_lines = lines[:1051]

# app.run()を追加
truncated_lines.append('\n')
truncated_lines.append('if __name__ == "__main__":\n')
truncated_lines.append('    app.run_server(debug=True, host="0.0.0.0", port=8050)\n')

# ファイルに書き込み
with open('C:\\Users\\ryone\\Desktop\\20251030oshi-app\\app.py', 'w', encoding='utf-8') as f:
    f.writelines(truncated_lines)

print('Successfully cleaned and added app.run() to app.py')
