# マルチステージビルドを使用
FROM python:3.11-slim as builder

# 必要な OS パッケージをインストール
RUN apt-get update && apt-get install -y \
    build-essential \
    libzbar0 \
    libzbar-dev \
    && rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# 依存関係をコピーしてインストール
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# 本番用イメージ
FROM python:3.11-slim

# 必要なランタイムパッケージをインストール
RUN apt-get update && apt-get install -y \
    libzbar0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 非rootユーザーを作成
RUN useradd --create-home --shell /bin/bash app

# 作業ディレクトリを設定
WORKDIR /app

# builderステージからPythonパッケージをコピー
COPY --from=builder /root/.local /home/app/.local

# アプリケーションのソースコードをコピー
COPY . .

# 権限を設定
RUN chown -R app:app /app
USER app

# Pythonパスを設定
ENV PATH=/home/app/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1

# ポート設定（デフォルト8050、環境変数で上書き可能）
ENV PORT=8050

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:$PORT/ || exit 1

# gunicorn で Dash のサーバーを起動（最適化設定）
CMD gunicorn app:server \
    --bind 0.0.0.0:$PORT \
    --workers 2 \
    --threads 4 \
    --worker-class gthread \
    --worker-tmp-dir /dev/shm \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --log-level info \
    --access-logfile - \
    --error-logfile -
