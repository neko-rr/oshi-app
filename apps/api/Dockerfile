# Render: Dockerfile Path = apps/api/Dockerfile
# ビルド文脈はリポジトリルート（Root Directory は空のまま）。
# ローカル: docker build -f apps/api/Dockerfile .
FROM python:3.11-slim

WORKDIR /app

COPY apps/api/requirements-prod.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt

COPY apps/api/app /app/app

ENV PYTHONUNBUFFERED=1
# ローカル docker 用。Render は Dashboard の PORT（既定 10000）を上書きする
ENV PORT=8000

RUN useradd --create-home --uid 1000 appuser \
    && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD python -c "import os,urllib.request; urllib.request.urlopen('http://127.0.0.1:%s/health' % os.environ.get('PORT','8000'), timeout=4)"

# Render は PORT で待受必須（公式 Web Services: bind 0.0.0.0 と PORT）
CMD ["sh", "-c", "exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
