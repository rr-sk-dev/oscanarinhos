# apps/capi — NestJS + Prisma

## Commands (scripts run in this folder; use `npm --prefix`)
- `start:dev`: watch mode. Needs `env/development.env` (gitignored; variables listed in README.md) and a running Postgres.
- `start:docker` / `stop:docker`: Postgres 16 + the API through `docker-compose.yml`.
- `test`: Jest unit tests (`src/**/*.spec.ts`). Pass a path for a single file: `test -- src/matches/matches.service.spec.ts`.
- `test:e2e`: `test/jest-e2e.json`.
- `lint`: ESLint 10 flat config (`eslint.config.mjs`) with `--fix`. Prettier runs as an ESLint rule using the root `.prettierrc`.
- `typecheck`: `tsc --noEmit`.
- `prisma:generate`, plus `npm exec -- prisma migrate dev`: `prisma.config.ts` loads `env/development.env` unless `NODE_ENV=production`. Migrations live in `prisma/migrations/`.
- `prisma:seed`: wipes the DB and inserts mock data from `prisma/seed-data.ts` (run by `tsx prisma/seed.ts`, refuses `NODE_ENV=production`). Images it references live in `apps/cfe/public/assets/seed/`. It creates no matches; those come from the fixtures/results scrapers.
- `members:create-admin -- <email> <team-slug>`: makes a user ADMIN of a team (creating the user if needed); bootstraps the first admin (`src/scripts/create-admin.ts`).
- `scrape`: runs the weekly cif.org.pt scrape once (`src/scrape.ts`, ts-node, boots only `CifScrapperModule`). `SCRAPE_DATABASE_URL` overrides the target database; otherwise `POSTGRES_URL` from `env/development.env`.

## Module layout
Every domain module (`matches`, `players`, `news`, `standings`, `scorers`, `teams` + `teams/staff`, `testimonials`) follows the same shape. Copy an existing one (`matches/` is the most complete) rather than inventing a new layout:
- `<x>.repository.ts`: an abstract class extending `database/BaseRepository<Entity, CreateData, UpdateData>`. It is the DI token services depend on.
- `<x>-prisma.repository.ts`: the Prisma implementation, bound in the module with `{ provide: XRepository, useClass: PrismaXRepository }`. Prisma queries, `include`/`orderBy` shapes and Prisma enum conversion stay here.
- `types/<x>.entity.ts` (domain types), `types/<x>.dto.ts` (response shapes, class-validator for inputs) and `types/<x>.mapper.ts` (`toDomain` from Prisma records, plus entity → DTO).
- `exceptions/<x>.exceptions.ts`: subclasses of `core/exceptions/base-domain-exception` with a `code`.
- `<x>.service.ts` holds the logic; `<x>.controller.ts` only delegates.
- A module that needs another module's data imports that module and uses its exported repository (e.g. `MatchesModule` imports `TeamsModule`; `ScrapperModule` imports the matches/standings/scorers modules).

## Database access
- `DatabaseModule.forRoot()` (global) provides `PrismaService`. A feature module imports `DatabaseModule.forFeature('<model>')`, and its Prisma repository injects the delegate with `@InjectModel('<model>') model: ModelDelegate<'<model>'>`.
- The Prisma client is generated to `prisma/generated/prisma`. JSON columns are typed through `prisma-json-types-generator` with `declare global { namespace PrismaJson { … } }` (see `teams/types/team-web-content.types.ts`).

## Errors
`core/filters/global-exception.filter.ts` maps a `DomainException` by its code suffix: `*_NOT_FOUND` → 404, `*_ALREADY_EXISTS` → 409, `*_INVALID` → 400 and `*_FORBIDDEN` → 403. Any other code is logged and returned as a generic 500, so name codes with those suffixes when the client should see them.

## Members area
Team-scoped routes live under `/api/teams/:teamId/...` and need a signed-in member. The migration `20261119161014_members_events_availability` must be applied (`npm exec -- prisma migrate deploy`).
- `auth/`: passwordless sign-in. `POST /auth/code` emails a one-time code through `EmailSender` (`console` logs it, `resend` sends it), `POST /auth/verify` returns a JWT. Exports `JwtAuthGuard`, `TeamMemberGuard` (loads the caller's membership of `:teamId` into the request), `RolesGuard` with `@Roles(...)`, plus `@CurrentUser()` / `@CurrentMembership()`.
- `users/`, `members/`: users, memberships (`ADMIN`, `COACH`, `PLAYER`, `STAFF`) and invites (`POST invites/:code/accept` signs in the invitee into the team). `me/`: `GET /me` with the caller's memberships.
- `events/`: events (`TRAINING`, `GAME`, `CUSTOM`) and recurring series (`POST series` materialises the occurrences). `GameSyncService` mirrors our scraped matches as `GAME` events. List/detail include `myAnswer` and answer counts.
- `availability/`: yes/no/maybe answers per event. `AvailabilityDataModule` holds the repository and the injectable `Clock` so `EventsModule` can read answers without a module cycle; `AvailabilityModule` has the controller and service. Inject `Clock`, never `new Date()`, in services that depend on time.
- `attendance/`: coaches and admins mark attendance after an event starts; `GET stats` returns per-player attendance percentages for a date range.
- Tenancy: every repository query filters by `teamId`, so an event or invite id from another team is a 404 (`*_NOT_FOUND`), never a 403 that would confirm it exists. A non-member of `:teamId` gets `TEAM_FORBIDDEN` (403).
- Env (validated in `core/environment/env-config.ts`): `JWT_SECRET` (at least 32 chars), `JWT_EXPIRES_IN` (default `30d`), `EMAIL_PROVIDER` (`console` | `resend`), `RESEND_API_KEY` and `EMAIL_FROM` (required only for `resend`).

## Other modules
- `scrapper/`: a `@Cron` job (Sundays 17:00 Europe/Lisbon) that scrapes, in order, fixtures, results, standings and scorers from cif.org.pt with cheerio and writes them through the domain repositories. Fixtures sync only our team's matches (`OUR_TEAM_NAME`) for all journeys, creating unknown teams with their CIF logo; finished matches are never touched. Matches have no season column, so the current season is the kickoff window `CURRENT_SEASON_KICKOFFS` (August to August). The season label (`CURRENT_SEASON`, currently `2026-27`) and the source URLs live in `scrapper/cif.constants.ts`; the seed imports it, and cfe's `SEASON` in `home/standings.service.ts` must match. A journey with any result counts as played: a pending match still without a result after its kickoff is marked `POSTPONED` and picked up again once the website shows its score. The video/YouTube scrapers exist but don't run at bootstrap.
- `images/`: R2 storage behind the `ImageStorageService` abstraction (`ImagesModule.forRoot()/forFeature(name)`, `@InjectImage`). Not imported into `AppModule` yet. Uploads are MIME-validated.
- `core/`: config validation at boot (`environment/env-validator.ts`) and the global exception filter.

## Conventions
- All routes are under the `/api` prefix. Existing routes are public; there is no global guard. Members-area controllers opt in per controller with `@UseGuards(JwtAuthGuard, TeamMemberGuard, RolesGuard)` from `auth/` (`AuthModule` exports them) and `@Roles(...)`. The global `ValidationPipe` uses `transform` + `whitelist`.
- Service unit tests build the service by hand with `jest.Mocked<XRepository>` objects. They don't use the Nest testing module (see `matches/matches.service.spec.ts`).
