# ベースイメージ
FROM python:3.14

# 必要な OS パッケージをインストール（zbar を含む）
RUN apt-get update && apt-get install -y \
    libzbar0 \
    libzbar-dev \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係をコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションのソースコードをコピー
COPY . .

# gunicorn で Dash のサーバーを起動
CMD ["gunicorn", "app:server", "-b", "0.0.0.0:10000"]
