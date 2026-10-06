@best-practices.md

# apps/cfe — Angular

- Angular 21, standalone components, Tailwind v4 (`.postcssrc.json`). The PWA service worker (`ngsw-config.json`) is enabled outside dev mode.
- Angular official Agent Skills installed: angular-developer
- See @best-practices.md (Angular's official file — updated by them, don't hand-edit). It targets v22, and this app is on v21, so:
  - Keep setting `changeDetection: ChangeDetectionStrategy.OnPush` explicitly, as the existing components do. It is not the default in v21.
  - Use `@Injectable({ providedIn: 'root' })`, not `@Service`.
  - The app is zone-based (`provideZoneChangeDetection` in `app/app.config.ts`).

## Commands (scripts run in this folder; use `npm --prefix`)
- `start`: `ng serve` at :4200. It talks to `environment.apiUrl` (localhost:3000 in dev).
- `build`: production build, which swaps in `environment.production.ts`.
- `test`: Karma + Jasmine in watch mode. `test:ci` runs once in ChromeHeadless (used by the pre-commit hook). Run a single spec with `test -- --include src/news/news.spec.ts`.
- `typecheck`: `tsc --noEmit` over `tsconfig.app.json` and `tsconfig.spec.json`.
- No linter. Prettier (root `.prettierrc`) formats staged files on commit.

## Structure
- Features sit at the top of `src/` (`home`, `results`, `squad`, `news`, `live`, `more`), not under `src/app`. `app/` holds only the root component, config and routes.
- `app/app.routes.ts` has two shells:
  - `AppLayout`: tab pages, with a bottom tab bar on mobile and a slim top bar + footer on desktop. A single instance is kept across tab navigation.
  - `DetailLayout`: back button plus minimal header, for `/matches/:id`, `/news/:slug`, `/squad/:id`, `/staff/:id` and `/live`.
  Pages other than home and results are lazy-loaded with `loadComponent`.
- `shared/cui/` is the in-house UI kit (button, modal, toast, confirmation dialog, inputs, spinner, …), imported as `@canarinhos/ngx-cui`. Theme tokens live in `cui/styles/theme.css`. Extend it rather than adding a component library.
- `@canarinhos/shared-types` (`shared/types/`) holds the API response types. They are maintained by hand to match capi's DTOs, so update both sides together.

## Data loading
- A feature's `*.service.ts` (`providedIn: 'root'`) wraps an `httpResource` and exposes `value`, `isLoading` and an `error` computed that holds a Portuguese message (reference: `home/next-match.service.ts`).
- URLs are `${environment.apiUrl}/api/...`, scoped to `environment.team.slug`.
- `shared/http-timeout.interceptor.ts` applies to every request.

## Testing
- Specs sit next to their component and are mostly `TestBed` "should create" smoke tests.
