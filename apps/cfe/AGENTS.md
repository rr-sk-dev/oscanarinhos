@best-practices.md

# apps/cfe — Angular

- Angular 22, standalone components, Tailwind v4 (`.postcssrc.json`). The PWA service worker (`ngsw-config.json`) is enabled outside dev mode. Needs Node `^22.22.3 || ^24.15.0 || >=26` (`engines` in `package.json`).
- Angular official Agent Skills installed: angular-developer
- See @best-practices.md (Angular's official file — updated by them, don't hand-edit). It targets v22, like this app:
  - `OnPush` is the default; don't set `changeDetection`.
  - Root singletons use `@Service()` (the existing services do), not `@Injectable({ providedIn: 'root' })`.
  - The app is still zone-based (`provideZoneChangeDetection` in `app/app.config.ts`).

## Commands (scripts run in this folder; use `npm --prefix`)
- `start`: `ng serve` at :4200. It talks to `environment.apiUrl` (localhost:3000 in dev).
- `build`: production build, which swaps in `environment.production.ts`.
- `test`: Vitest through the Angular `unit-test` builder, in jsdom, in watch mode. `test:ci` runs once (used by the pre-commit hook). Run a single spec with `test -- --include src/news/news.spec.ts`.
- `typecheck`: `tsc --noEmit` over `tsconfig.app.json` and `tsconfig.spec.json`.
- No linter. Prettier (root `.prettierrc`) formats staged files on commit.

## Structure
- Features sit at the top of `src/` (`home`, `results`, `squad`, `news`, `live`, `more`), not under `src/app`. `app/` holds only the root component, config, routes, the title strategy and the navigation error handler.
- `app/app.routes.ts` has two shells, both on path `''` (the router falls through from the first to the second):
  - `AppLayout`: tab pages, with a bottom tab bar on mobile and a slim top bar + footer on desktop. A single instance is kept across tab navigation.
  - `DetailLayout`: back button plus minimal header, for `/matches/:id`, `/news/:slug`, `/squad/:id`, `/staff/:id` and `/live`. Back goes to `/home` when the page was opened from a link.
  Pages other than home and results are lazy-loaded with `loadComponent`.
- Every route sets a `title`; `AppTitleStrategy` appends the team name.
- Route params reach components as signal inputs (`withComponentInputBinding`), e.g. `id = input.required<string>()`. Don't read `ActivatedRoute.snapshot`.
- Formatting for templates lives in pipes (`src/pipes/`, plus `squad/staff-role.pipe.ts`); don't call formatting methods from templates.
- The current CIF season (`id` for the API, `label` for the UI) is `APP_CONSTANTS.season` in `shared/app.constants.ts`. Change it there only.
- `shared/cui/` is the in-house UI kit (modal on native `<dialog>`, SVG icons, YouTube player), imported as `@canarinhos/ngx-cui`. Theme tokens live in `cui/styles/theme.css` and are registered for Tailwind in `src/styles.css`. Extend it rather than adding a component library, and only add what a page uses.
- `@canarinhos/shared-types` (`shared/types/`) holds the API response types. They are maintained by hand to match capi's DTOs, so update both sides together.

## Data loading
- A feature's `*.service.ts` (`providedIn: 'root'`) wraps an `httpResource` and exposes its value, `isLoading` and an `error` computed that holds a Portuguese message (reference: `home/next-match.service.ts`).
- Expose the value through `valueOr(resource, fallback)` (`shared/resource-value.ts`), never `resource.value` directly: `value()` throws while the resource is in the error state, which breaks every template and computed that reads it.
- State that depends on the clock (live status, countdown) reads a time signal from `shared/now.ts`; a `computed` over `Date.now()` never updates. Whether a match is live is decided only by `liveStatus` in `shared/match-status.ts`.
- Our team is identified by id (`TeamService.id`), not by name; see `shared/team-result.ts`.
- URLs are `${environment.apiUrl}/api/...`, scoped to `environment.team.slug`.
- `shared/http-timeout.interceptor.ts` applies to every request.

## Testing
- Specs sit next to their code. Pure logic (pipes, `shared/*.ts`, `groupByDate`, `countdownUnits`) is tested directly; components are tested through `HttpTestingController` and the rendered DOM. `shared/testing/match.fixture.ts` builds test matches.
- The app is zone-based, so use `fixture.autoDetectChanges()`: `whenStable()` alone does not re-render.
- Tests run in jsdom. `src/test-setup.ts` fills in what jsdom lacks (`<dialog>` methods). With fake timers, fake only what the test drives (e.g. `toFake: ['setInterval', 'Date']`), or `whenStable()` never resolves.
- Never set a class field to a bare imported name (`MatchStatus = MatchStatus`, `items = ITEMS`). Under Vitest the module transform snapshots that import before it is initialized, so the field is `undefined` in tests (production is fine). Expose a member (`finished = MatchStatus.FINISHED`), use a pipe, or keep the constant in the same file.
