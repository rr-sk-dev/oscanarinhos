# capi

REST API for Os Canarinhos — serves match results, squad, standings, news, and team details.

## Tech stack

- **NestJS 11** — framework
- **PostgreSQL 16** — database
- **Prisma 7** — ORM (client generated to `prisma/generated/prisma`)
- **Cloudflare R2** — image storage (URLs stored in DB, served directly via CDN)
- **Docker Compose** — local PostgreSQL

## Prerequisites

- Node.js 22+
- Docker (for local PostgreSQL)

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
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `POSTGRES_URL` | PostgreSQL connection string |
| `R2_ACCOUNT_ID` | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | R2 access key |
| `R2_SECRET_ACCESS_KEY` | R2 secret key |
| `R2_BUCKET_NAME` | R2 bucket name |
| `R2_PUBLIC_URL` | Public CDN base URL for images |

**2. Start the API**

```bash
npm install
npm run start:docker   # starts PostgreSQL + API via Docker Compose
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
npm run start:dev      # Watch mode (no Docker)
npm run start:docker   # Docker Compose (PostgreSQL + API)
npm run stop:docker    # Stop Docker services
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
