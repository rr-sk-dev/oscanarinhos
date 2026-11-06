# cfe

Angular 22 PWA for Os Canarinhos — displays match results, squad, standings, news, and live streams.

## Tech stack

- **Angular 22** — framework (standalone components, signals, `OnPush` by default)
- **Tailwind CSS v4** — styling
- **PWA** — service worker via `@angular/pwa`

## Prerequisites

- Node.js 22.22.3+ or 24.15+ (required by Angular 22)
- `capi` backend running at `http://localhost:3000`

## Setup

**1. Configure the environment**

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  apiUrl: 'http://localhost:3000',
  team: {
    slug: 'your-team-slug',
    name: 'Your Team Name',
    subtitle: 'Your subtitle',
  },
};
```

**2. Start the dev server**

```bash
npm install
npm start              # dev server at http://localhost:4200
```

## Scripts

```bash
npm start              # Dev server (http://localhost:4200)
npm run build          # Production build (outputs to dist/cfe)
npm test               # Unit tests (Vitest, watch mode)
npm run test:coverage  # Unit tests once, with a coverage report
npm run lint           # angular-eslint, incl. template accessibility rules
npm run watch          # Dev build in watch mode
```

## Deployment (Cloudflare Pages)

Project settings:

| Setting | Value |
| --- | --- |
| Root directory | `apps/cfe` |
| Build command | `npm run build` |
| Build output directory | `dist/cfe/browser` |

- Node comes from `.node-version` (Angular 22 needs 22.22.3+ or 24.15+).
- No redirects file is needed: the build has no `404.html`, so Pages serves `index.html` for app routes like `/news/<slug>`.
- No `_headers` file is needed: Pages revalidates files by default, so `index.html`, `ngsw.json` and `ngsw-worker.js` are not served stale and the update banner works. After the first deploy, `curl -I https://<domain>/ngsw.json` should show `max-age=0` (or `no-cache`).
- Production domain: `https://oscanarinhos.rrodrigues.dev` (also in the Open Graph tags in `src/index.html`). Add it to the API's `CORS_ORIGINS` (comma-separated).

## Notes

- The team logo and team photo are fetched from the API at runtime via `TeamService` — no local image assets needed.
- The production build includes a service worker. After `npm run build`, the SW is in `dist/cfe`.
- Shared types are path-aliased as `@canarinhos/shared-types` → `src/shared/types/lib/`.
