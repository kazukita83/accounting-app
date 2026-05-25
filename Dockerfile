# ============================================================
# Dockerfile — 経費管理アプリ (静的ファイル / nginx)
# ============================================================
FROM nginx:alpine

# nginx設定をコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# アプリの静的ファイルをコピー
COPY app/ /usr/share/nginx/html/

# Cloud Run はポート8080を使用
EXPOSE 8080
