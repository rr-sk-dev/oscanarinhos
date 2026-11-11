# Os Canarinhos

PWA for an amateur football team based in Lisbon. Tracks matches, results, squad, standings, and news.

## Structure

```
apps/
  cfe/   # Angular 21 PWA (frontend)
  capi/  # NestJS 11 REST API (backend)
```

## Tech stack

| | Frontend | Backend |
|---|---|---|
| **Framework** | Angular 21 | NestJS 11 |
| **Language** | TypeScript | TypeScript |
| **Styling** | Tailwind CSS v4 | — |
| **Database** | — | PostgreSQL 18 + Prisma 7 |
| **Image storage** | — | Cloudflare R2 |
| **Deployment** | PWA (service worker), nginx (unprivileged) | Docker |

## Getting started

Each app lives in its own directory with its own `package.json`. Commands must be run from within the app directory.

**1. Start the backend** (needs a PostgreSQL 18 reachable via `POSTGRES_URL` in `apps/capi/env/development.env`)

```bash
cd apps/capi
npm install
npx prisma migrate deploy
npm run start:dev
```

The API will be available at `http://localhost:3000` (health check: `/api/health`).

**2. Start the frontend**

```bash
cd apps/cfe
npm install
npm start              # dev server at http://127.0.0.1:4200, proxies /api to 127.0.0.1:3000
```

See each app's README for further setup details.

## Run prod-like locally

`compose.prodlike.yaml` runs the production images (PostgreSQL 18, one-shot migrations, API, web)
with a read-only root filesystem, all capabilities dropped and secrets mounted as files.
Only the web container is published, on `127.0.0.1:8080`; `/api/*` is forwarded to the API by a
dev-only nginx location (`deploy/prodlike/web-api-proxy.conf`). In production that routing is done
by the host's Caddy (`/api/*` → `capi:3000`, everything else → `web:8080`).

**1. Create the secrets** (from the repo root; `.secrets/` is gitignored)

```bash
umask 077
mkdir -p .secrets
openssl rand -hex 32 > .secrets/postgres_password
printf 'postgresql://capi:%s@postgres:5432/capi?schema=public\n' "$(cat .secrets/postgres_password)" > .secrets/postgres_url
printf '%s\n' 'replace-me' > .secrets/r2_access_key_id      # real R2 key to test uploads
printf '%s\n' 'replace-me' > .secrets/r2_secret_access_key
printf '%s\n' 'replace-me' > .secrets/youtube_api_key
# The containers run as different UIDs (postgres 999, node 1000) and Compose cannot chown
# file secrets: the files are made readable, the directory stays private to your user.
chmod 0444 .secrets/*
chmod 0700 .secrets
```

**2. Non-secret API settings**

```bash
cp deploy/prodlike/capi.env.example deploy/prodlike/capi.env   # gitignored; edit as needed
```

**3. Build and run**

```bash
docker compose -f compose.prodlike.yaml up -d --build
docker compose -f compose.prodlike.yaml ps
curl -i http://127.0.0.1:8080/api/health   # {"status":"ok"}
open http://127.0.0.1:8080                 # or xdg-open
docker compose -f compose.prodlike.yaml down      # add -v to also drop the database volume
```

The API reads every variable either directly or from a file via `<NAME>_FILE`
(e.g. `POSTGRES_URL_FILE=/run/secrets/postgres_url`); setting both is an error.

## License

[MIT](LICENSE)
