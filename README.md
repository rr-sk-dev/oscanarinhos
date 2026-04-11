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
| **Database** | — | PostgreSQL 16 + Prisma 7 |
| **Image storage** | — | Cloudflare R2 |
| **Deployment** | PWA (service worker) | Docker |

## Getting started

Each app lives in its own directory with its own `package.json`. Commands must be run from within the app directory.

**1. Start the backend**

```bash
cd apps/capi
npm install
npm run start:docker   # starts PostgreSQL + API via Docker Compose
```

The API will be available at `http://localhost:3000`.

**2. Start the frontend**

```bash
cd apps/cfe
npm install
npm start              # dev server at http://localhost:4200
```

See each app's README for further setup details.

## License

[MIT](LICENSE)
