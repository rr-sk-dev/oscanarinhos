# ---------------------------------------------------------------------------
# build: Angular production build
# Needs network access to fonts.googleapis.com (production build inlines fonts).
# ---------------------------------------------------------------------------
# TODO pin by digest
FROM node:26-trixie-slim AS build
WORKDIR /app
ENV NG_CLI_ANALYTICS=false \
    npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

# ---------------------------------------------------------------------------
# runtime: static files on unprivileged nginx (UID 101), port 8080.
# Read-only root filesystem compatible: pid/temp paths are under /tmp.
# ---------------------------------------------------------------------------
# TODO pin by digest
FROM nginxinc/nginx-unprivileged:stable-alpine AS runtime
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/cfe/browser /usr/share/nginx/html
USER 101
EXPOSE 8080
# busybox wget ships with the Alpine base image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["wget", "-q", "--spider", "http://127.0.0.1:8080/healthz"]
