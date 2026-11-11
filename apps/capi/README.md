# capi

REST API for Os Canarinhos — serves match results, squad, standings, news, and team details.

## Tech stack

- **NestJS 11** — framework
- **PostgreSQL 18** — database
- **Prisma 7** — ORM (client generated to `prisma/generated/prisma`)
- **Cloudflare R2** — image storage (URLs stored in DB, served directly via CDN)

## Prerequisites

- Node.js 22+
- A PostgreSQL 18 database (the dev container provides one; see also `compose.prodlike.yaml` at the repo root)

## Setup

**1. Create the environment file**

Copy the sample and fill in your values:

```bash
cp env/development.env.example env/development.env
```

Required variables:

| Variable | Description |
|---|---|
| `NODE_ENV` | `development` or `production` |
| `PORT` | API port (3000–3004) |
| `CORS_ORIGINS` | Optional. Comma-separated allowed origins; unset → CORS disabled (same-origin) |
| `POSTGRES_URL` | PostgreSQL connection string |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public CDN base URL for images |
| `YOUTUBE_API_KEY` | YouTube Data API key |
| `YOUTUBE_BASE_URL` | YouTube Data API base URL |
| `YOUTUBE_CHANNEL_HANDLE` | YouTube channel handle |

Any variable can instead be read from a file with `<NAME>_FILE` (e.g. `POSTGRES_URL_FILE=/run/secrets/postgres_url`),
for Docker/Compose secrets. Setting both `<NAME>` and `<NAME>_FILE` is an error. `prisma.config.ts`
(migrations) honours `POSTGRES_URL_FILE` too.

**2. Start the API**

```bash
npm install
npm run start:dev
```

The API will be available at `http://localhost:3000`.

**3. Run database migrations**

On first run (or after schema changes):

```bash
npx prisma migrate dev
npx prisma generate
npm run prisma:seed    # optional: seed with sample data
```

## Scripts

```bash
npm run start:dev      # Watch mode
npm run build          # Production build
npm run lint           # ESLint with auto-fix
npm run format         # Prettier
npm test               # Unit tests
npm run test:cov       # Coverage report
npm run test:e2e       # End-to-end tests
```

## API endpoints

All routes are prefixed with `/api`. All routes are public.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/teams/:name/details` | Team details (name, logo, photo, season) |
| `GET` | `/players?teamName=` | Squad list |
| `GET` | `/team-staff?teamName=` | Coaching staff |
| `GET` | `/matches/next/:team` | Next upcoming match |
| `GET` | `/matches/upcoming/:team` | All upcoming matches |
| `GET` | `/matches/by-team/:team` | All matches (upcoming + results) |
| `GET` | `/matches/results/:team` | Finished matches |
| `GET` | `/matches/:id` | Single match detail |
| `GET` | `/news` | News articles list |
| `GET` | `/news/slug/:slug` | Single article by slug |
| `GET` | `/standings/:season/context/:teamName` | League table with team context |
| `GET` | `/testimonials` | Active testimonials |
| `GET` | `/health` | Liveness + DB check: 200 `{"status":"ok"}`, 503 if the database is unreachable |

## Docker

`Dockerfile` targets: `runtime` (default; API, port 3000, `USER node`) and `migrate`
(`prisma migrate deploy`, run once before the API). Both work with a read-only root filesystem
(+ tmpfs `/tmp`). See "Run prod-like locally" in the root README.
