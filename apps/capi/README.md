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
| `JWT_SECRET` | Secret used to sign sign-in tokens, at least 32 characters |
| `JWT_EXPIRES_IN` | Optional token lifetime, default `30d` |
| `EMAIL_PROVIDER` | `console` (logs the sign-in code, for development) or `resend` (required when `NODE_ENV=production`) |
| `RESEND_API_KEY` | Resend API key, required only when `EMAIL_PROVIDER=resend` |
| `EMAIL_FROM` | Sender address, required only when `EMAIL_PROVIDER=resend` |
| `VAPID_PUBLIC_KEY` | Web push VAPID public key. Required when `NODE_ENV=production`; push is disabled in development without it |
| `VAPID_PRIVATE_KEY` | Web push VAPID private key (keep it secret). Required when `NODE_ENV=production` |
| `VAPID_SUBJECT` | Contact for push services: a `mailto:` or `https:` URL, e.g. `mailto:admin@example.com`. Required when `NODE_ENV=production` |
| `FRONTEND_URL` | The PWA origin used in notification links. Required when `NODE_ENV=production`. Must be **exactly** the PWA origin: scheme + host, no trailing path, and `www` vs apex must match the installed app, otherwise a tapped notification opens outside the installed PWA |

**2. Start the API**

```bash
npm install
npm run start:docker   # starts PostgreSQL + API via Docker Compose
```

The API will be available at `http://localhost:3000`.

PostgreSQL is published on port 5432. If that port is taken, set `POSTGRES_PORT` (e.g. `POSTGRES_PORT=5433 docker compose up -d postgres`) and use the same port in `POSTGRES_URL`.

**3. Run database migrations**

On first run (or after schema changes):

```bash
npx prisma migrate dev
npx prisma generate
npm run prisma:seed    # optional: wipe and fill the DB with mock data
npm run scrape         # load the season calendar, results, standings and scorers from cif.org.pt
```

The seed (`prisma/seed.ts`, fixtures in `prisma/seed-data.ts`) deletes every row before inserting, and refuses to run when `NODE_ENV=production`. Image paths point at `apps/cfe/public/assets/seed/`, so they load when cfe serves the app. It creates no matches: `npm run scrape` loads the real season calendar and results from cif.org.pt.

`npm run scrape` runs the weekly scrape job once. It writes to `POSTGRES_URL` from `env/development.env`; to point it at another database, set `SCRAPE_DATABASE_URL`:

```bash
SCRAPE_DATABASE_URL=postgresql://user:password@host:5432/capi npm run scrape
```

## Notifications rollout checklist

Cancel and reschedule alerts go out as web push, with an email fallback. Before the first production deploy:

1. Generate the VAPID key pair once: `npx web-push generate-vapid-keys` (run in `apps/capi`). Never change the pair afterwards: existing subscriptions would stop working.
2. Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and `FRONTEND_URL` in production **before** deploying. Boot fails if any is missing or if a key or the subject is invalid.
3. Run `prisma migrate deploy` against a copy of the production database first: the `push_subscriptions` migration was written by hand.
4. Deploy capi.
5. Replace `vapidPublicKey` in `apps/cfe/src/environments/environment.production.ts` with the same public key, then deploy cfe.
6. Check the Resend plan's rate limit (emails are paced 600 ms apart) and that the sender domain is verified.
7. Test by hand on Android Chrome, on an iOS PWA added to the home screen, and on desktop.

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
npm run members:create-admin -- <email> <team-slug>   # Make a user admin of a team
```

## API endpoints

All routes are prefixed with `/api`. The routes below are public; the members area (`/auth`, `/me`, `/teams/:teamId/...`) needs a signed-in team member (see `AGENTS.md`).

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
