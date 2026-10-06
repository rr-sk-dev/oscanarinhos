# apps/capi — NestJS + Prisma

## Commands (scripts run in this folder; use `npm --prefix`)
- `start:dev`: watch mode. Needs `env/development.env` (gitignored; variables listed in README.md) and a running Postgres.
- `start:docker` / `stop:docker`: Postgres 16 + the API through `docker-compose.yml`.
- `test`: Jest unit tests (`src/**/*.spec.ts`). Pass a path for a single file: `test -- src/matches/matches.service.spec.ts`.
- `test:e2e`: `test/jest-e2e.json`.
- `lint`: ESLint 10 flat config (`eslint.config.mjs`) with `--fix`. Prettier runs as an ESLint rule using the root `.prettierrc`.
- `typecheck`: `tsc --noEmit`.
- `prisma:generate`, plus `npm exec -- prisma migrate dev`: `prisma.config.ts` loads `env/development.env` unless `NODE_ENV=production`. Migrations live in `prisma/migrations/`.
- `prisma:seed`: wipes the DB and inserts mock data from `prisma/seed-data.ts` (run by `tsx prisma/seed.ts`, refuses `NODE_ENV=production`). Images it references live in `apps/cfe/public/assets/seed/`.

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
`core/filters/global-exception.filter.ts` maps a `DomainException` by its code suffix: `*_NOT_FOUND` → 404 and `*_ALREADY_EXISTS` → 409. Any other code is logged and returned as a generic 500, so name codes with those suffixes when the client should see them.

## Other modules
- `scrapper/`: a `@Cron` job (Sundays 17:00 Europe/Lisbon) that scrapes results, standings and scorers from cif.org.pt with cheerio and writes them through the domain repositories. The season label (`CURRENT_SEASON`, currently `2026-27`) and the source URLs live in `scrapper/cif.constants.ts`; the seed imports it, and cfe's `SEASON` in `home/standings.service.ts` must match. A journey with any result counts as played: a pending match still without a result after its kickoff is marked `POSTPONED` and picked up again once the website shows its score. The video/YouTube scrapers exist but don't run at bootstrap.
- `images/`: R2 storage behind the `ImageStorageService` abstraction (`ImagesModule.forRoot()/forFeature(name)`, `@InjectImage`). Not imported into `AppModule` yet. Uploads are MIME-validated.
- `core/`: config validation at boot (`environment/env-validator.ts`) and the global exception filter.

## Conventions
- All routes are under the `/api` prefix and are public (no auth guards). The global `ValidationPipe` uses `transform` + `whitelist`.
- Service unit tests build the service by hand with `jest.Mocked<XRepository>` objects. They don't use the Nest testing module (see `matches/matches.service.spec.ts`).
