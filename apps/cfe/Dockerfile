# ---------------------------------------------------------------------------
# build: Angular production build
# Needs network access to fonts.googleapis.com (production build inlines fonts).
# ---------------------------------------------------------------------------
FROM node:26-trixie-slim@sha256:e6bedef217677b276c591795e169840edd9096dbf13f29df8ef8d1856b8820bc AS build
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
FROM nginxinc/nginx-unprivileged:stable-alpine@sha256:f5116ed4606f3eb015dd4a8e28cb9b351476dc0ad4bc6e9f93b19cec130cdf03 AS runtime
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist/cfe/browser /usr/share/nginx/html
USER 101
EXPOSE 8080
# busybox wget ships with the Alpine base image.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ["wget", "-q", "--spider", "http://127.0.0.1:8080/healthz"]
