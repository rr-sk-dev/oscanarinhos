@best-practices.md

# apps/cfe — Angular

- Angular 22, standalone components, Tailwind v4 (`.postcssrc.json`). The PWA service worker (`ngsw-config.json`) is enabled outside dev mode. Needs Node `^22.22.3 || ^24.15.0 || >=26` (`engines` in `package.json`).
- Angular official Agent Skills installed: angular-developer
- See @best-practices.md (Angular's official file — updated by them, don't hand-edit). It targets v22, like this app:
  - `OnPush` is the default; don't set `changeDetection`.
  - Root singletons use `@Service()` (the existing services do), not `@Injectable({ providedIn: 'root' })`.
  - The app is zoneless (Angular's default since v21; there is no zone.js). Templates update from signals, inputs and template events only, so keep state in signals.
  - Use `NgOptimizedImage` (`ngSrc`) for every image: `width`/`height` for fixed square assets, `fill` inside a sized, positioned box for cropped photos and API images of unknown shape, `priority` on the page's main image, and `sizes` in viewport units only.

## Commands (scripts run in this folder; use `npm --prefix`)
- `start`: `ng serve` at :4200. It talks to `environment.apiUrl` (localhost:3000 in dev).
- `build`: production build, which swaps in `environment.production.ts`.
- `test`: Vitest through the Angular `unit-test` builder, in jsdom, in watch mode. `test:ci` runs once (used by the pre-commit hook); `test:coverage` adds a V8 coverage report. Run a single spec with `test -- --include src/news/news.spec.ts`.
- `typecheck`: `tsc --noEmit` over `tsconfig.app.json` and `tsconfig.spec.json`.
- `lint`: angular-eslint, including the template accessibility rules (`eslint.config.js`). On commit, lint-staged runs it with `--fix` on staged `src/` files, then Prettier (root `.prettierrc`).

## Structure
- Features sit at the top of `src/` (`home`, `results`, `squad`, `news`, `live`, `more`), not under `src/app`. `app/` holds only the root component, config, routes, the title strategy and the navigation error handler.
- `app/app.routes.ts` has two shells, both on path `''` (the router falls through from the first to the second):
  - `AppLayout`: tab pages, with a bottom tab bar on mobile and a slim top bar + footer on desktop. A single instance is kept across tab navigation.
  - `DetailLayout`: back button plus minimal header, for `/matches/:id`, `/news/:slug`, `/squad/:id`, `/staff/:id` and `/live`. Back goes to `/home` when the page was opened from a link.
  Pages other than home and results are lazy-loaded with `loadComponent`.
- Every route sets a `title`; `AppTitleStrategy` appends the team name.
- Route params reach components as signal inputs (`withComponentInputBinding`), e.g. `id = input.required<string>()`. Don't read `ActivatedRoute.snapshot`.
- Dates, numbers and prices use Angular's pipes (`date`, `currency`, …), which format for pt-PT through `LOCALE_ID` (`app/locale.ts`). App-specific formatting lives in pipes (`shared/pipes/`, plus `squad/age.pipe.ts` and `squad/staff-role.pipe.ts`); don't call formatting methods from templates.
- The current CIF season (`id` for the API, `label` for the UI) is `APP_CONSTANTS.season` in `shared/app.constants.ts`. Change it there only.
- Pages are containers (inject services, compute state) composed of presentational components that only take inputs and emit outputs, e.g. Home and its `home/*` sections. Shared app components: `shared/team-crest` (a team's crest or placeholder), `shared/update-banner`.
- `shared/cui/` is the in-house UI kit (`cui-` prefix: error state with retry, modal on native `<dialog>`, SVG icons incl. outline ones, YouTube player), imported as `@canarinhos/ngx-cui`. Use `cui-svg-icon` rather than inline SVGs, and theme tokens (`cui-*`) rather than hex colors. Theme tokens live in `cui/styles/theme.css` and are registered for Tailwind in `src/styles.css`. Extend it rather than adding a component library, and only add what a page uses.
- `@canarinhos/shared-types` (`shared/types/`) holds the API response types. They are maintained by hand to match capi's DTOs, so update both sides together.

## Data loading
- A feature's `*.service.ts` (`@Service()`) wraps an `httpResource` and exposes its value, `isLoading` and an `error` computed that holds a Portuguese message (reference: `home/next-match.service.ts`).
- Expose the value through `valueOr(resource, fallback)` (`shared/resource-value.ts`), never `resource.value` directly: `value()` throws while the resource is in the error state, which breaks every template and computed that reads it.
- State that depends on the clock (live status, countdown) reads a time signal from `shared/now.ts`; a `computed` over `Date.now()` never updates. Whether a match is live is decided only by `liveStatus` in `shared/match-status.ts`.
- Our team is identified by id (`TeamService.id`), not by name; see `shared/team-result.ts`.
- URLs are `${environment.apiUrl}/api/...`, scoped to `environment.team.slug`.
- `shared/http-timeout.interceptor.ts` applies to every request.
- Data stays fresh: each service exposes `reload()` and calls `reloadOnResume()` (`shared/data-refresh.ts`), which refetches after 5 minutes in the background or when the device comes back online. Pages showing a live match also poll with `reloadWhile()`.
- Show load errors with `cui-error-state` and wire its `retry` to the resource's `reload()`; pass `[canRetry]="false"` when a retry cannot help (e.g. "not found").
- `AppUpdateService` offers new app versions (update banner) and the service worker keeps the last API responses for offline use (`dataGroups` in `ngsw-config.json`).
- Detail pages set their tab title from their data with `injectPageTitle()` (`app/app-title.strategy.ts`).

## Testing
- Specs sit next to their code. Pure logic (pipes, `shared/*.ts`, `groupByDate`, `countdownUnits`) is tested directly; components are tested through `HttpTestingController` and the rendered DOM. `shared/testing/` builds test matches, players and staff.
- Act, then `await fixture.whenStable()`, then assert. `whenStable()` also waits for open HTTP requests, so flush them first; after an action that starts a request (e.g. a retry), call `TestBed.tick()` before `expectOne`.
- Tests run with the pt-PT locale (`src/test-providers.ts`, the unit-test `providersFile`).
- Tests run in jsdom. `src/test-setup.ts` fills in what jsdom lacks (`<dialog>` methods). With fake timers, fake only what the test drives (e.g. `toFake: ['setInterval', 'Date']`), or `whenStable()` never resolves.
- Never set a class field to a bare imported name (`MatchStatus = MatchStatus`, `items = ITEMS`). Under Vitest the module transform snapshots that import before it is initialized, so the field is `undefined` in tests (production is fine). Expose a member (`finished = MatchStatus.FINISHED`), use a pipe, or keep the constant in the same file.
