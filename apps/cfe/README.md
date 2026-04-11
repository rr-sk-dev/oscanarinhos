# cfe

Angular 21 PWA for Os Canarinhos — displays match results, squad, standings, news, and live streams.

## Tech stack

- **Angular 21** — framework (standalone components, signals, `OnPush`)
- **Tailwind CSS v4** — styling
- **PWA** — service worker via `@angular/pwa`

## Prerequisites

- Node.js 22+
- `capi` backend running at `http://localhost:3000`

## Setup

**1. Configure the environment**

Edit `src/environments/environment.ts`:

```typescript
export const environment = {
  apiUrl: 'http://localhost:3000',
  liveVideoId: '',          // YouTube video ID for the live page
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
npm test               # Unit tests (Karma/Jasmine)
npm run watch          # Dev build in watch mode
```

## Notes

- The team logo and team photo are fetched from the API at runtime via `TeamService` — no local image assets needed.
- The production build includes a service worker. After `npm run build`, the SW is in `dist/cfe`.
- Shared types are path-aliased as `@canarinhos/shared-types` → `src/shared/types/lib/`.
