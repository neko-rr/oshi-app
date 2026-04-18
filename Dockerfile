# マルチステージビルド (Render 用軽量構成)
FROM python:3.11-slim AS builder

# 必要なビルド依存 / zbar を導入
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libzbar0 \
    libzbar-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt


# 本番イメージ
FROM python:3.11-slim

# ランタイムに必要な最低限のパッケージ
RUN apt-get update && apt-get install -y --no-install-recommends \
    libzbar0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# 非 root ユーザー
RUN useradd --create-home --shell /bin/bash app
WORKDIR /app

# Python ユーザーインストールのパスをコピー
COPY --from=builder /root/.local /home/app/.local

# アプリソースをコピー
COPY . .

# 権限
RUN chown -R app:app /app
USER app

# 環境変数
ENV PATH=/home/app/.local/bin:$PATH \
    PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PORT=8050

EXPOSE 8050

# ヘルスチェック（Render は PORT を可変で注入するため $PORT に合わせる）
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f "http://127.0.0.1:${PORT}/login" || exit 1

# Render 想定: exec で PID1=gunicorn とし SIGTERM を正しく処理。Dash の長めリクエスト向けに timeout を延長。
CMD ["sh", "-c", "exec gunicorn server:app --bind 0.0.0.0:${PORT} --workers 1 --threads 2 --worker-class gthread --worker-tmp-dir /dev/shm --timeout 120 --graceful-timeout 30 --max-requests 500 --max-requests-jitter 25 --log-level info --access-logfile - --error-logfile -"]
