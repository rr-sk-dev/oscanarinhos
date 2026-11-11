# ---------------------------------------------------------------------------
# base
# ---------------------------------------------------------------------------
# TODO pin by digest
FROM node:26-trixie-slim AS base
WORKDIR /app
ENV CHECKPOINT_DISABLE=1 \
    PRISMA_HIDE_UPDATE_MESSAGE=1 \
    npm_config_update_notifier=false \
    npm_config_fund=false \
    npm_config_audit=false

# ---------------------------------------------------------------------------
# deps: full dependency tree (dev included)
# openssl lets Prisma detect the platform and download the matching
# schema engine during install; the engine (migrations) links against libssl.
# ---------------------------------------------------------------------------
# TODO pin by digest
FROM base AS deps
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*
COPY package.json package-lock.json ./
RUN npm ci

# ---------------------------------------------------------------------------
# build: generate the Prisma client and compile.
# nest build compiles prisma/generated/** into dist/prisma/generated/**,
# entrypoint is dist/src/main.js.
# ---------------------------------------------------------------------------
# TODO pin by digest
FROM deps AS build
COPY . .
RUN npx prisma generate \
    && npm run build

# ---------------------------------------------------------------------------
# prod-deps: production-only node_modules
# ---------------------------------------------------------------------------
# TODO pin by digest
FROM build AS prod-deps
RUN npm prune --omit=dev

# ---------------------------------------------------------------------------
# migrate: one-shot `prisma migrate deploy`
#   docker build --target migrate ...
# Reads POSTGRES_URL or POSTGRES_URL_FILE (see prisma.config.ts).
# ---------------------------------------------------------------------------
# TODO pin by digest
FROM deps AS migrate
ENV NODE_ENV=production \
    npm_config_cache=/tmp/.npm
COPY prisma ./prisma
COPY prisma.config.ts ./
# prisma.config.ts shares the *_FILE resolution logic with the API
COPY src/core/environment/env-files.ts ./src/core/environment/env-files.ts
USER node
CMD ["npx", "prisma", "migrate", "deploy"]

# ---------------------------------------------------------------------------
# runtime (default target)
# Files are root-owned and read-only for the app user; nothing is written at
# runtime, so it runs with a read-only root filesystem (+ tmpfs /tmp).
# ---------------------------------------------------------------------------
# TODO pin by digest
FROM base AS runtime
ENV NODE_ENV=production \
    PORT=3000 \
    npm_config_cache=/tmp/.npm
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/api/health').then(r => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]
CMD ["node", "dist/src/main.js"]
