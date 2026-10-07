@rules/commits.md
@rules/git-workflow.md
@rules/code-style.md

# Os Canarinhos

PWA for an amateur football team in Lisbon: matches, results, squad, standings, news, live stream. UI copy is Portuguese (Portugal).

Two independent apps, each with its own `package.json` and lockfile (not an npm workspace — the capi Docker build depends on its own lockfile):

- `apps/capi` — NestJS 11 REST API, Prisma 7 + PostgreSQL 16, Cloudflare R2 (see @apps/capi/AGENTS.md)
- `apps/cfe` — Angular 21 PWA, Tailwind v4 (see @apps/cfe/AGENTS.md)

The root `package.json` holds repo tooling only: husky, lint-staged, commitlint, Prettier.

## Setup
Install all three: `npm install` at the root (this also runs `husky` to set `core.hooksPath`), then `npm ci` in `apps/capi` and `apps/cfe`. Run `npm run prisma:generate` in capi before the first typecheck: the client is generated into the gitignored `prisma/generated/`.

## Shell commands
Use absolute paths; never `cd` in a shell command. Run app scripts with `npm --prefix /abs/path/apps/<app> run <script>` (e.g. `npm --prefix /abs/path/apps/capi test -- src/matches/matches.service.spec.ts`), and `grep -n foo /abs/path/docs/x.md`. A `cd` makes later relative paths impossible to check before the command runs, which triggers a permission prompt.

## Root scripts and git hooks
- `npm run typecheck`: `tsc --noEmit` in both apps.
- `npm test`: capi Jest, then cfe Vitest (jsdom, no browser needed).
- `npm run lint`: capi ESLint. cfe has no linter, only Prettier.
- `npm run format`: Prettier over the repo, using root `.prettierrc` (printWidth 100) and `.prettierignore`.
- `pre-commit` runs `lint-staged`, `typecheck` and `test`. lint-staged (`.lintstagedrc.mjs`) runs ESLint `--fix` (which includes Prettier) on capi `.ts` files and plain Prettier on everything else.
- `commit-msg` runs commitlint (`@commitlint/config-conventional`). Commits before this setup used gitmoji; new ones must be Conventional Commits.

## Deployment
- capi: Docker image built from `apps/capi/Dockerfile`, served at `https://api.rrodrigues.dev`.
- cfe: production build reads `src/environments/environment.production.ts`.
- There is no CI in this repo (no `.github/`). The git hooks are the only automated gate.
