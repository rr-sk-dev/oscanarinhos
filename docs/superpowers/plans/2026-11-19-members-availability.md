# Members Area: Accounts, Calendar and Availability Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Os Canarinhos a signed-in members area with a team calendar (trainings, games, custom events), per-member availability answers and attendance statistics, scoped by team so other teams can be added later.

**Architecture:** New capi modules (`auth`, `members`, `events`, `availability`, `attendance`) follow the existing repository/service/controller layout and are all scoped by `teamId` in the route (`/api/teams/:teamId/...`). Passwordless sign-in issues a JWT through the already-installed `@nestjs/jwt`/`passport-jwt`; a guard resolves the caller's `Membership` for the route's team and a role guard gates writes. Games are `Event` rows of type `GAME` that reference a scraped `Match` and are upserted from matches, never entered by hand. cfe gets a `members/` feature folder with signal-based services, lazy routes and the existing `cui-` kit.

**Tech Stack:** NestJS 11, Prisma 7 + PostgreSQL 16, `@nestjs/jwt`, `passport-jwt`, `luxon` (new, timezone-safe recurrence), Jest; Angular 22 zoneless, Tailwind v4, Vitest.

**Spec:** `docs/superpowers/specs/2026-11-19-members-availability-design.md`

## Global Constraints

- UI copy is Portuguese (Portugal); dates and numbers go through Angular pipes (pt-PT `LOCALE_ID`), never formatting methods in templates.
- Every event, response, attendance row and membership carries a `teamId` (directly or through its event) and every query filters by it. A user from team A asking for team B's event gets 404, not 403 and not data.
- Existing public `/api` routes stay public: no global auth guard; guards are applied per controller.
- No passwords are stored. Sign-in is an emailed code.
- Roles: `ADMIN`, `COACH`, `PLAYER`, `STAFF`. `ADMIN` and `COACH` create/edit events and mark attendance. Only `ADMIN` invites and removes members. All four roles answer availability.
- Availability answers: `YES`, `NO`, `MAYBE`, optional note, changeable until the event starts. Game events are never created by hand.
- Follow `apps/capi/AGENTS.md` (module layout, `*_NOT_FOUND`/`*_ALREADY_EXISTS` exception code suffixes map to 404/409, services tested with hand-built `jest.Mocked<XRepository>`, no Nest testing module) and `apps/cfe/AGENTS.md` (`@Service()` + `httpResource` + `valueOr`, container vs presentational components, `NgOptimizedImage`, no default `changeDetection`, no `ActivatedRoute.snapshot`, never `field = ImportedName`).
- `@canarinhos/shared-types` (`apps/cfe/src/shared/types/`) is hand-maintained: update it in the same task as the capi DTO it mirrors.
- Code style: braces on every `if`/`else`/`for`/`while`; guard clauses; no AI attribution lines in commits (project rule overrides any tooling default); Conventional Commits (`feat(capi): …`, `feat(cfe): …`); never `git push` without asking.
- Shell: absolute paths, never `cd`. Run scripts as `npm --prefix /Users/ruben.rodrigues/Documents/projects/oscanarinhos/apps/<app> run <script>`. Before starting, fetch `dev` over HTTPS and branch from it (see memory notes on sandbox git/Node versions).
- Recurring times are interpreted in `Europe/Lisbon` and stored as UTC instants.

## Review Focus

Inputs and conditions the spec implies but no ordinary happy-path test covers, most likely first. Each has a test in the owning task.

1. A member of team A calls a team B route or event id: 404, no data leak (Tasks 4, 5, 6).
2. Answering after the event started, or for a cancelled event: rejected with a clear error (Task 6).
3. Sign-in code reuse, expiry, wrong-guess lockout, and unknown email (no user enumeration, same response) (Task 2).
4. Recurring 21:00 training across the DST change (last Sunday of March/October) stays at 21:00 Lisbon time (Task 5).
5. Scraper reschedules or postpones a match: the linked game event moves/cancels, and existing answers survive (Task 5).
6. Removing or demoting the last admin of a team is refused (Task 3).
7. One user in two teams: `/me` lists both and each team's data stays separate (Tasks 3, 11).

---

## File Structure

capi (`apps/capi/src/`), one folder per module, each with `<x>.module.ts`, `<x>.controller.ts`, `<x>.service.ts`, `<x>.repository.ts`, `<x>-prisma.repository.ts`, `types/`, `exceptions/`:

- `auth/`: login codes, JWT, `EmailSender` abstraction (+ console and Resend implementations), `JwtAuthGuard`, `TeamMemberGuard`, `RolesGuard`, `@Roles()`, `@CurrentUser()`, `@CurrentMembership()`.
- `members/`: memberships and invites.
- `events/`: events, recurring series, game sync from matches.
- `availability/`: answers and the grouped summary.
- `attendance/`: attendance marking and statistics.
- `core/environment/env-config.ts`: new variables.
- `prisma/schema.prisma`, `prisma/migrations/`, `prisma/seed.ts`, `src/scripts/create-admin.ts`.

cfe (`apps/cfe/src/members/`): `auth/` (service, interceptor, guard, sign-in page), `invite/` (accept page), `calendar/` (list, month, service), `event/` (detail, response buttons, response list, event form, attendance), `stats/`, plus `shared/types/lib/{member,event,availability,stats}.ts`.

---

### Task 1: Database schema and migration

**Files:**
- Modify: `apps/capi/prisma/schema.prisma`
- Create: `apps/capi/prisma/migrations/<timestamp>_members_events_availability/migration.sql` (generated)
- Modify: `apps/capi/prisma/seed.ts`, `apps/capi/prisma/seed-data.ts`

**Interfaces:**
- Produces (Prisma models and enums used by every later capi task): `User{id, email @unique (stored lowercase), name?}`, `Membership{id, userId, teamId, role: MembershipRole, playerId?, staffId?, @@unique([userId, teamId])}`, `Invite{id, teamId, role, code @unique, playerId?, staffId?, maxUses, uses, expiresAt, createdByMembershipId}`, `LoginCode{id, email, codeHash, expiresAt, attempts, consumedAt?}`, `EventSeries{id, teamId, title, location?, weekdays Int[], startTime String "HH:mm", durationMinutes Int, startDate, endDate}`, `Event{id, teamId, type: EventType, title, startsAt, endsAt?, location?, notes?, respondBy?, status: EventStatus, matchId? @unique, seriesId?}`, `Availability{id, eventId, membershipId, answer: AvailabilityAnswer, note?, @@unique([eventId, membershipId])}`, `Attendance{id, eventId, membershipId, attended Boolean, @@unique([eventId, membershipId])}`. Enums: `MembershipRole {ADMIN COACH PLAYER STAFF}`, `EventType {TRAINING GAME CUSTOM}`, `EventStatus {SCHEDULED CANCELED}`, `AvailabilityAnswer {YES NO MAYBE}`. Indexes on `Event(teamId, startsAt)`, `Membership(teamId)`, `LoginCode(email)`.

- [ ] **Step 1:** Add the models above to `schema.prisma` (relations to `Team`, `Player`, `TeamStaff`, `Match`; cascade deletes from `Event` to `Availability`/`Attendance`).
- [ ] **Step 2:** Run `npm --prefix /Users/ruben.rodrigues/Documents/projects/oscanarinhos/apps/capi exec -- prisma migrate dev --name members_events_availability`. Expected: migration created and applied.
- [ ] **Step 3:** Run `npm --prefix …/apps/capi run prisma:generate` then `npm --prefix …/apps/capi run typecheck`. Expected: no errors.
- [ ] **Step 4:** Extend the seed to create a dev admin `User` + `ADMIN` `Membership` for the seeded team, email from `SEED_ADMIN_EMAIL` (default `admin@canarinhos.test`). Run `prisma:seed`; expected: completes without error and the row exists.
- [ ] **Step 5:** Commit: `feat(capi): add members, events and availability schema`.

### Task 2: Passwordless authentication

**Files:**
- Create: `apps/capi/src/auth/{auth.module.ts, auth.controller.ts, auth.service.ts, auth.service.spec.ts}`, `auth/login-code.repository.ts`, `auth/login-code-prisma.repository.ts`, `auth/email/{email-sender.ts, console-email-sender.ts, resend-email-sender.ts}`, `auth/guards/{jwt-auth.guard.ts, team-member.guard.ts, roles.guard.ts}`, `auth/decorators/{roles.decorator.ts, current-user.decorator.ts, current-membership.decorator.ts}`, `auth/types/auth.dto.ts`, `auth/exceptions/auth.exceptions.ts`, `users/` minimal `UserRepository` (`findByEmail`, `create`, `findById`) with Prisma implementation
- Modify: `apps/capi/src/core/environment/env-config.ts` (add `JWT_SECRET` string min 32 chars, `JWT_EXPIRES_IN` default `30d`, `EMAIL_PROVIDER` enum `console|resend`, `RESEND_API_KEY` and `EMAIL_FROM` required only when provider is `resend`), `apps/capi/src/app.module.ts`

**Interfaces:**
- Produces: `abstract class EmailSender { abstract send(to: string, subject: string, body: string): Promise<void> }`; `AuthService.requestCode(email: string): Promise<void>`; `AuthService.verifyCode(email: string, code: string): Promise<{ accessToken: string }>`; JWT payload `{ sub: string }`; `@CurrentUser(): { userId: string }`; `TeamMemberGuard` (reads `:teamId`, loads the caller's membership, sets `request.membership: MembershipEntity`, throws `NotATeamMemberException` mapped to 403 with code `TEAM_FORBIDDEN`; the 404-vs-403 rule: a route naming an event id of another team still 404s in the service); `@Roles(...roles: MembershipRole[])` + `RolesGuard` (403 `ROLE_FORBIDDEN`); `@CurrentMembership(): MembershipEntity`. Routes: `POST /api/auth/code {email}` → 204, `POST /api/auth/verify {email, code}` → `{ accessToken }`.
- Consumes: `MembershipRepository.findByUserAndTeam(userId, teamId): Promise<MembershipEntity | null>` from Task 3 (defined in Task 3, imported via `MembersModule`). **Execution order: Task 1, Task 3, then Task 2**, because the guards need the membership repository.

- [ ] **Step 1: Write failing `auth.service.spec.ts`** with hand-built mocks: `requestCode` stores a hashed 6-digit code (expires in 10 min), sends one email, and resolves identically for unknown and known emails; email is trimmed and lowercased; `verifyCode` returns a token for a correct unexpired code and marks it consumed; throws `InvalidLoginCodeException` for a wrong code, an expired code and an already consumed code; after 5 wrong attempts the code is dead even if the right digits are then sent; `verifyCode` creates the `User` on first successful sign-in and reuses it after.
- [ ] **Step 2:** Run `npm --prefix …/apps/capi test -- src/auth/auth.service.spec.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `AuthService` and the repositories. Use `crypto.randomInt` for the code and `crypto.createHash('sha256')` with the email as salt for `codeHash`; compare with `timingSafeEqual`. Domain exceptions: `InvalidLoginCodeException` code `LOGIN_CODE_INVALID` (mapped to 400 in `global-exception.filter.ts`, which currently only maps `*_NOT_FOUND`/`*_ALREADY_EXISTS`; add `*_INVALID` → 400 and `*_FORBIDDEN` → 403 there, with a spec in `core/filters/`).
- [ ] **Step 4:** Run the spec again. Expected: PASS.
- [ ] **Step 5:** Implement `JwtAuthGuard` (passport-jwt strategy using `JWT_SECRET`), `TeamMemberGuard`, `RolesGuard`, decorators; spec `team-member.guard.spec.ts` covers: no membership → `TEAM_FORBIDDEN`; member of team A with team B id in the route → `TEAM_FORBIDDEN`; role guard allows `ADMIN`/`COACH` and rejects `PLAYER` for a `@Roles('ADMIN','COACH')` route.
- [ ] **Step 6:** Implement `ConsoleEmailSender` (logs the code, default in development) and `ResendEmailSender` (POST to the Resend REST API with `fetch`, throws on non-2xx); bind by `EMAIL_PROVIDER` with a factory provider. Extend `env-validator` spec (or add one) so `resend` without keys fails boot.
- [ ] **Step 7:** Run `typecheck`, `lint` and `test` for capi. Expected: all pass. Commit: `feat(capi): add passwordless sign-in and team guards`.

### Task 3: Memberships and invites

**Files:**
- Create: `apps/capi/src/members/{members.module.ts, members.controller.ts, members.service.ts, members.service.spec.ts, membership.repository.ts, membership-prisma.repository.ts, invite.repository.ts, invite-prisma.repository.ts}`, `members/types/{membership.entity.ts, membership.dto.ts, membership.mapper.ts, invite.entity.ts}`, `members/exceptions/members.exceptions.ts`, `apps/capi/src/me/{me.controller.ts, me.module.ts}`
- Create: `apps/capi/src/scripts/create-admin.ts` and script `members:create-admin` in `apps/capi/package.json` (args: email, team slug)

**Interfaces:**
- Produces: `MembershipEntity { id, userId, teamId, role: MembershipRole, playerId: string | null, staffId: string | null, displayName: string }`; `MembershipRepository` with `findByUserAndTeam(userId, teamId)`, `findByTeam(teamId)`, `countAdmins(teamId)`, `create`, `update`, `delete`; `MembersService.createInvite(teamId, creator: MembershipEntity, input: { role, playerId?, staffId? }): Promise<InviteEntity>` (code: 10 chars, expires in 7 days, `maxUses` 1); `MembersService.acceptInvite(userId, code): Promise<MembershipEntity>`; `MembersService.remove(teamId, membershipId)`. Routes: `GET /api/teams/:teamId/members` (any member), `POST /api/teams/:teamId/invites` (`ADMIN`), `POST /api/invites/:code/accept` (JWT only, no team guard), `DELETE /api/teams/:teamId/members/:membershipId` (`ADMIN`), `GET /api/me` → `{ user: { id, email, name }, memberships: { teamId, teamName, role, membershipId }[] }`.
- `displayName` comes from the linked `Player.fullName` or `TeamStaff` name, else the user's name, else the email local part.

- [ ] **Step 1: Write failing `members.service.spec.ts`:** accepting a valid invite creates a membership with the invite's role and links the player/staff; an expired invite, an invite used up (`uses >= maxUses`) and an unknown code throw (code `INVITE_INVALID`, mapped to 400 by the `*_INVALID` rule added in Task 2); a user already in the team gets `MEMBERSHIP_ALREADY_EXISTS` (409) and the invite is not consumed; accepting an invite for a `playerId` already linked to another membership throws `MEMBERSHIP_ALREADY_EXISTS`; removing or demoting the only remaining admin throws `LAST_ADMIN_FORBIDDEN`; the same user can hold memberships in two teams.
- [ ] **Step 2:** Run `npm --prefix …/apps/capi test -- src/members/members.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement repositories, service, mapper, controller (controller only delegates; apply `JwtAuthGuard`, `TeamMemberGuard`, `@Roles('ADMIN')` where listed). Add `*_FORBIDDEN` handling already added in Task 2.
- [ ] **Step 4:** Run the spec. Expected: PASS.
- [ ] **Step 5:** Implement the `create-admin` script (boots only the database module, upserts the `User`, creates an `ADMIN` membership; refuses an unknown team slug). Verify manually: run it against the dev DB and check with `GET /api/me` after signing in (record the result in the commit body).
- [ ] **Step 6:** Mirror DTOs in `apps/cfe/src/shared/types/lib/member.ts` (`Membership`, `Role`, `MeResponse`, `Invite`) and export from `index.ts`.
- [ ] **Step 7:** `typecheck`, `lint`, `test`. Commit: `feat(capi): add memberships and invites`.

### Task 4: Events (one-off) and cross-team isolation

**Files:**
- Create: `apps/capi/src/events/{events.module.ts, events.controller.ts, events.service.ts, events.service.spec.ts, event.repository.ts, event-prisma.repository.ts}`, `events/types/{event.entity.ts, event.dto.ts, event.mapper.ts}`, `events/exceptions/event.exceptions.ts`

**Interfaces:**
- Produces: `EventEntity { id, teamId, type, title, startsAt: Date, endsAt: Date | null, location, notes, respondBy: Date | null, status, matchId, seriesId }`; `EventRepository` with `findByTeamBetween(teamId, from, to)`, `findByIdInTeam(teamId, id)`, `create`, `update`, `createMany`; `EventsService.list(teamId, from, to): Promise<EventEntity[]>`; `get(teamId, eventId)`; `create(teamId, input: CreateEventDto): Promise<EventEntity>` (types `TRAINING` and `CUSTOM` only; `GAME` rejected with `EVENT_TYPE_INVALID`); `update(teamId, eventId, patch: UpdateEventDto)` (fields: title, startsAt, endsAt, location, notes, respondBy, status; a `GAME` event may only change `notes`, because time/place/status come from the match). Routes: `GET /api/teams/:teamId/events?from&to` (ISO dates, max range 400 days), `GET …/events/:eventId`, `POST …/events` and `PATCH …/events/:eventId` (`ADMIN`, `COACH`).
- `findByIdInTeam` is the only lookup by id; a missing or other-team event throws `EventNotFoundException` (404).

- [ ] **Step 1: Write failing `events.service.spec.ts`:** create rejects `GAME`; `endsAt` before `startsAt` throws `EVENT_DATES_INVALID`; `respondBy` after `startsAt` throws the same; `get` for an event id belonging to another team throws `EventNotFoundException` (mock `findByIdInTeam` returns null); patching a `GAME` event's `startsAt` is refused; list rejects a range over 400 days.
- [ ] **Step 2:** Run `npm --prefix …/apps/capi test -- src/events/events.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement repository, service, controller (guards: `JwtAuthGuard`, `TeamMemberGuard`; `@Roles('ADMIN','COACH')` on writes), DTOs with class-validator.
- [ ] **Step 4:** Run the spec. Expected: PASS.
- [ ] **Step 5:** Add `apps/cfe/src/shared/types/lib/event.ts` (`CalendarEvent`, `EventType`, `EventStatus`, `CreateEventInput`) and export it.
- [ ] **Step 6:** `typecheck`, `lint`, `test`. Commit: `feat(capi): add team events`.

### Task 5: Recurring series and game sync

**Files:**
- Create: `apps/capi/src/events/{series.service.ts, series.service.spec.ts, series.repository.ts, series-prisma.repository.ts, game-sync.service.ts, game-sync.service.spec.ts}`, `events/types/series.dto.ts`
- Modify: `apps/capi/src/events/events.controller.ts`, `events.module.ts`, `apps/capi/src/scrapper/` (call game sync after the fixtures/results steps), `apps/capi/package.json` (add `luxon`, `@types/luxon`)

**Interfaces:**
- Consumes: `MatchRepository` (exported by `MatchesModule`), `TeamService`/`OUR_TEAM_NAME` for our team's id, `EventRepository` from Task 4.
- Produces: `SeriesService.create(teamId, input: { title, location?, weekdays: number[] /* 1=Mon..7=Sun */, startTime: string /* "HH:mm" */, durationMinutes: number, startDate: string, endDate: string }): Promise<EventEntity[]>` (materialises one `TRAINING` event per occurrence, max 366 occurrences; occurrences are ordinary `Event` rows with `seriesId`, so moving or cancelling one is a normal `PATCH`); `GameSyncService.syncTeam(teamId, ourTeamId: string): Promise<{ created: number; updated: number }>` (idempotent upsert by `matchId`: title `"<home> vs <away>"`, `startsAt` = kickoff, `location` = match location, `status` `CANCELED` when the match is `CANCELED` or `POSTPONED`, else `SCHEDULED`; never touches existing availability rows); route `POST /api/teams/:teamId/events/series` (`ADMIN`, `COACH`); `GET …/events` calls `syncTeam` first for the requested range's season window so the calendar never misses a game (spec: nothing entered twice).

- [ ] **Step 1: Write failing `series.service.spec.ts`:** Tue+Thu 21:00 for four weeks yields 8 events at 21:00 `Europe/Lisbon`; a series spanning the last Sunday of March keeps 21:00 Lisbon local time (UTC hour changes from 21 to 20) and likewise in October; `endDate` before `startDate` or a range over 366 occurrences throws `SERIES_INVALID`; empty weekdays throws.
- [ ] **Step 2:** Run `npm --prefix …/apps/capi test -- src/events/series.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `SeriesService` with `luxon` (`DateTime.fromISO(..., { zone: 'Europe/Lisbon' })`), persist the series row and the events in one transaction via the repository.
- [ ] **Step 4:** Run the spec. Expected: PASS.
- [ ] **Step 5: Write failing `game-sync.service.spec.ts`:** a new match creates a `GAME` event; running twice creates it once; a match whose kickoff changes updates `startsAt` of the same event id; a `POSTPONED` match sets `CANCELED` and when it later gets a date and `SCHEDULED` status flips back; matches not involving our team are ignored; matches outside the current season window are ignored.
- [ ] **Step 6:** Run it (FAIL), implement `GameSyncService`, run again (PASS).
- [ ] **Step 7:** Wire the controller route and the call from the scrape module (after results). Run `typecheck`, `lint`, `test`. Commit: `feat(capi): add recurring trainings and game sync`.

### Task 6: Availability answers and summary

**Files:**
- Create: `apps/capi/src/availability/{availability.module.ts, availability.controller.ts, availability.service.ts, availability.service.spec.ts, availability.repository.ts, availability-prisma.repository.ts}`, `availability/types/{availability.entity.ts, availability.dto.ts, availability.mapper.ts}`, `availability/exceptions/availability.exceptions.ts`
- Modify: `events/events.controller.ts` or the events DTO mapper so `GET …/events` and `…/events/:eventId` include `myAnswer: AvailabilityAnswer | null` and counts `{ yes, maybe, no, noAnswer }`.

**Interfaces:**
- Consumes: `EventRepository.findByIdInTeam`, `MembershipRepository.findByTeam`, `@CurrentMembership()`.
- Produces: `AvailabilityService.respond(teamId, eventId, membership: MembershipEntity, input: { answer: AvailabilityAnswer; note?: string /* max 140 */ }, now: Date): Promise<AvailabilityEntity>` (upsert on `(eventId, membershipId)`); `AvailabilityService.summary(teamId, eventId): Promise<{ yes: MemberResponse[]; maybe: MemberResponse[]; no: MemberResponse[]; noAnswer: MemberResponse[] }>` where `MemberResponse { membershipId, displayName, role, note: string | null }`. Routes: `PUT /api/teams/:teamId/events/:eventId/availability`, `GET …/availability` (any member).
- `now` is injected from a clock provider so tests control time.

- [ ] **Step 1: Write failing `availability.service.spec.ts`:** responding twice updates the same row; responding after `startsAt` throws `EVENT_CLOSED_FORBIDDEN`; responding to a `CANCELED` event throws `EVENT_CLOSED_FORBIDDEN`; responding after `respondBy` (but before start) is rejected the same way; event from another team throws `EventNotFoundException`; note over 140 chars throws a validation error at DTO level (DTO test); `summary` puts members with no row in `noAnswer` and lists staff and delegates alongside players.
- [ ] **Step 2:** Run `npm --prefix …/apps/capi test -- src/availability/availability.service.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement repository, service, controller, and add the answer fields to the event DTO mapper.
- [ ] **Step 4:** Run the spec and the events spec. Expected: PASS.
- [ ] **Step 5:** Add `apps/cfe/src/shared/types/lib/availability.ts` (`AvailabilityAnswer`, `MemberResponse`, `AvailabilitySummary`) and extend `CalendarEvent` with `myAnswer` and `counts`.
- [ ] **Step 6:** `typecheck`, `lint`, `test`. Commit: `feat(capi): add event availability`.

### Task 7: Attendance and statistics

**Files:**
- Create: `apps/capi/src/attendance/{attendance.module.ts, attendance.controller.ts, attendance.service.ts, attendance.service.spec.ts, stats.service.ts, stats.service.spec.ts, attendance.repository.ts, attendance-prisma.repository.ts}`, `attendance/types/{attendance.dto.ts, stats.dto.ts}`

**Interfaces:**
- Produces: `AttendanceService.mark(teamId, eventId, entries: { membershipId: string; attended: boolean }[], now: Date): Promise<void>` (only after the event started, not for `CANCELED` events, only for memberships of that team); `StatsService.get(teamId, from: Date, to: Date): Promise<TeamStats>` with `TeamStats { members: { membershipId, displayName, role, markedEvents: number, attended: number, attendancePercent: number }[]; byType: { type: EventType; events: number; averageAttended: number }[] }`. Routes: `PUT /api/teams/:teamId/events/:eventId/attendance` (`ADMIN`, `COACH`), `GET /api/teams/:teamId/stats?from&to` (any member; default range the current season window from `CURRENT_SEASON_KICKOFFS`).
- Definition: a member's `attendancePercent` = `attended / markedEvents` rounded to a whole number, counting only past, non-cancelled events where attendance was marked for that member; `0` when `markedEvents` is 0 (no division by zero). `averageAttended` per type = total attended rows / events of that type with any marks, one decimal.

- [ ] **Step 1: Write failing `attendance.service.spec.ts`:** marking before the event starts throws `EVENT_NOT_STARTED_FORBIDDEN`; marking a cancelled event throws; marking a membership of another team throws `MembershipNotFoundException` (404); marking twice upserts.
- [ ] **Step 2: Write failing `stats.service.spec.ts`:** member with 3 marked events and 2 attended → 67; member with none → 0 and no `NaN`; a cancelled event is excluded; events outside the range are excluded; `byType` groups `TRAINING` and `GAME` separately.
- [ ] **Step 3:** Run `npm --prefix …/apps/capi test -- src/attendance`. Expected: FAIL.
- [ ] **Step 4:** Implement repositories, services, controller. Run again. Expected: PASS.
- [ ] **Step 5:** Add `apps/cfe/src/shared/types/lib/stats.ts` mirroring `TeamStats`.
- [ ] **Step 6:** `typecheck`, `lint`, `test` for capi; wire all new modules into `AppModule`; boot the API against the dev DB (`start:dev`) and check that `GET /api/matches` still works without a token (public routes unaffected). Commit: `feat(capi): add attendance and stats`.

### Task 8: cfe sign-in, token and route guard

**Files:**
- Create: `apps/cfe/src/members/auth/{auth.service.ts, auth.service.spec.ts, auth.interceptor.ts, auth.interceptor.spec.ts, auth.guard.ts, sign-in/sign-in.ts, sign-in/sign-in.html, sign-in/sign-in.spec.ts}`
- Modify: `apps/cfe/src/app/app.config.ts` (add `authInterceptor` after `httpTimeoutInterceptor`), `apps/cfe/src/app/app.routes.ts`

**Interfaces:**
- Produces: `AuthService` (`@Service()`) with signals `isSignedIn: Signal<boolean>`, `me: Signal<MeResponse | null>`, `activeMembership: Signal<MeMembership | null>` (the membership whose `teamId` equals `TeamService.id`, else the first), methods `requestCode(email: string): Promise<void>`, `verify(email: string, code: string): Promise<void>`, `signOut(): void`. Token stored in `localStorage` (try/catch around access; app works signed-out if storage fails). `authInterceptor` adds `Authorization: Bearer <token>` only to requests starting with `environment.apiUrl`, and on a 401 clears the token and navigates to `/members/sign-in`. `authGuard: CanActivateFn` redirects to `/members/sign-in?next=<url>`. Route `members/sign-in` (title `Entrar`).

- [ ] **Step 1: Write failing specs:** interceptor adds the header for API URLs and not for others; 401 clears the token; guard redirects when signed out and passes when signed in; sign-in page shows the code field after the email is submitted, shows a Portuguese error message for a wrong code (`Código inválido ou expirado.`) and navigates to `next` on success.
- [ ] **Step 2:** Run `npm --prefix …/apps/cfe run test:ci -- --include src/members/auth`. Expected: FAIL.
- [ ] **Step 3:** Implement per the interfaces. The page is a container; use `cui-` inputs/buttons (extend the kit only if a control is missing).
- [ ] **Step 4:** Run again. Expected: PASS. Run `typecheck`, `lint`.
- [ ] **Step 5:** Commit: `feat(cfe): add members sign-in`.

### Task 9: cfe invite acceptance and members entry point

**Files:**
- Create: `apps/cfe/src/members/invite/{accept-invite.ts, accept-invite.html, accept-invite.spec.ts}`
- Modify: `apps/cfe/src/more/more.html` (+ `more.ts`), `apps/cfe/src/app/app.routes.ts`

**Interfaces:**
- Consumes: `AuthService`, `authGuard`.
- Produces: route `members/invite/:code` (`code = input.required<string>()`), which requires sign-in (guard returns here via `next`), calls `POST /api/invites/:code/accept`, then reloads `AuthService.me` and navigates to `/members`; error state via `cui-error-state` with `[canRetry]="false"` for invalid or expired codes. The More page gets an `Área de membros` link to `/members` (to `/members/sign-in` when signed out).

- [ ] **Step 1: Write failing spec:** a valid code posts once, reloads `me`, navigates to `/members`; a 400 shows the error state without retry.
- [ ] **Step 2:** Run it (FAIL), implement, run it (PASS).
- [ ] **Step 3:** Add the More entry; extend `app-routing.spec.ts` to assert `/members` is guarded and `/home` is not.
- [ ] **Step 4:** `typecheck`, `lint`, `test:ci`. Commit: `feat(cfe): add invite acceptance and members entry`.

### Task 10: cfe calendar (list view)

**Files:**
- Create: `apps/cfe/src/members/calendar/{calendar.service.ts, calendar.service.spec.ts, calendar.ts, calendar.html, calendar.spec.ts, event-card/event-card.ts}`
- Modify: `apps/cfe/src/app/app.routes.ts`

**Interfaces:**
- Produces: `CalendarService` (`@Service()`, `httpResource`) with `events: Signal<CalendarEvent[]>` (via `valueOr`), `isLoading`, `error`, `reload()`, `range: WritableSignal<{ from: Date; to: Date }>` (default: today through 60 days ahead), calling `GET ${apiUrl}/api/teams/${teamId}/events?from&to`, and `reloadOnResume()`. `EventCard` presentational: input `event: CalendarEvent`, shows type, title, date/time (pipes), place, my answer and counts, a canceled badge. Route `members` (guarded, title `Calendário`) lists events grouped by day with the existing `groupByDate` helper; a coach/admin sees a `Novo evento` button (`activeMembership().role`).

- [ ] **Step 1: Write failing specs** with `HttpTestingController`: renders events from the response grouped by day; a canceled event shows the badge; the `Novo evento` button is hidden for `PLAYER` and `STAFF`; an HTTP error shows `cui-error-state` and retry calls `reload()`; request is scoped to the active membership's team id.
- [ ] **Step 2:** Run `npm --prefix …/apps/cfe run test:ci -- --include src/members/calendar`. Expected: FAIL.
- [ ] **Step 3:** Implement. Dates come from pipes (`date`), not formatting methods.
- [ ] **Step 4:** Run (PASS), `typecheck`, `lint`. Commit: `feat(cfe): add members calendar list`.

### Task 11: cfe event detail and availability

**Files:**
- Create: `apps/cfe/src/members/event/{event-detail.ts, event-detail.html, event-detail.spec.ts, event.service.ts, event.service.spec.ts, response-buttons/response-buttons.ts, response-list/response-list.ts}`
- Modify: `apps/cfe/src/app/app.routes.ts` (route `members/events/:id` under `DetailLayout`, guarded, `id = input.required<string>()`)

**Interfaces:**
- Consumes: `AuthService.activeMembership`, `CalendarService.reload()`.
- Produces: `EventService` for one event (`event`, `summary: Signal<AvailabilitySummary>`, `respond(answer, note?)`, `reload()`); presentational `ResponseButtons` (input `answer: AvailabilityAnswer | null`, `disabled: boolean`; output `answered: { answer; note?: string }`; labels `Vou`, `Talvez`, `Não vou`); presentational `ResponseList` (input `summary`). After `respond`, the service calls `PUT …/availability` then reloads the summary and the calendar. Buttons are disabled with a message (`Respostas fechadas`) when the event started, is canceled, or `respondBy` passed (using the clock signal from `shared/now.ts`).
- For `ADMIN`/`COACH` the page shows `Editar` (Task 12) and, after the start, `Marcar presenças` (Task 12).

- [ ] **Step 1: Write failing specs:** tapping `Vou` sends `PUT` with `YES` and refreshes the lists; the note is sent when filled; buttons are disabled for a canceled event and after start (fake only `Date` per the testing guidance); the list shows four groups with counts and shows staff in the same lists; a 404 from the API shows the not-found error state with `[canRetry]="false"`.
- [ ] **Step 2:** Run the specs (FAIL), implement, run again (PASS).
- [ ] **Step 3:** `typecheck`, `lint`, `test:ci`. Commit: `feat(cfe): add event detail and availability answers`.

### Task 12: cfe event form and attendance marking

**Files:**
- Create: `apps/cfe/src/members/event/event-form/{event-form.ts, event-form.html, event-form.spec.ts}`, `apps/cfe/src/members/event/attendance/{attendance-panel.ts, attendance-panel.html, attendance-panel.spec.ts}`
- Modify: `apps/cfe/src/app/app.routes.ts` (routes `members/events/new` and `members/events/:id/edit`, guarded), `event-detail.html`

**Interfaces:**
- Produces: `EventForm` container with type (`TRAINING`/`CUSTOM`), title, start, end, place, notes, respond-by and a `Repetir` section (weekdays, until date) that posts to `…/events/series`; edit mode PATCHes one occurrence and offers `Cancelar evento` (sets `status: CANCELED`); a `GAME` event only allows editing notes. `AttendancePanel` (input `summary`, output `saved`) lists everyone with a checkbox, pre-checked for `YES` answers, and `PUT`s `…/attendance` (visible only to `ADMIN`/`COACH` after the start). Both screens are unreachable for `PLAYER`/`STAFF` (guard redirects to the calendar).

- [ ] **Step 1: Write failing specs:** a valid training posts the right body; a series posts weekdays/startTime/endDate to `/series`; end before start shows a Portuguese validation message and does not post; canceling sets `CANCELED`; the panel pre-checks `YES` answers and posts `{ entries }`; a `PLAYER` navigating to `/members/events/new` is redirected.
- [ ] **Step 2:** Run (FAIL), implement, run (PASS).
- [ ] **Step 3:** `typecheck`, `lint`, `test:ci`. Commit: `feat(cfe): add event form and attendance marking`.

### Task 13: cfe month view and stats page

**Files:**
- Create: `apps/cfe/src/members/calendar/month-view/{month-view.ts, month-view.html, month-view.spec.ts}`, `apps/cfe/src/members/stats/{stats.service.ts, stats.service.spec.ts, stats.ts, stats.html, stats.spec.ts}`
- Modify: `calendar.html` (toggle `Lista` / `Mês`), `app.routes.ts` (route `members/stats`, title `Estatísticas`)

**Interfaces:**
- Produces: `MonthView` presentational (inputs `month: Date`, `events: CalendarEvent[]`; output `eventSelected: string`, `monthChange: Date`), a 6x7 grid with a dot per event type per day; `StatsService` (`stats: Signal<TeamStats>`, range default current season) calling `GET …/stats`; stats page lists each member with `attendancePercent` and `attended/markedEvents`, plus the per-type turnout. Informational only: sorted by name, no ranking, no medals.

- [ ] **Step 1: Write failing specs:** month grid places events on the right day and starts weeks on Monday; changing month emits `monthChange`; stats page renders `67%` for a member and `0%` with `Sem presenças registadas` when `markedEvents` is 0; members are sorted alphabetically.
- [ ] **Step 2:** Run (FAIL), implement, run (PASS).
- [ ] **Step 3:** `typecheck`, `lint`, `test:ci`. Commit: `feat(cfe): add month view and attendance stats`.

### Task 14: Docs and full verification

**Files:**
- Modify: `apps/capi/AGENTS.md` (new modules, auth guards, env vars, `members:create-admin`), `apps/cfe/AGENTS.md` (members area, `AuthService`, interceptor), root `AGENTS.md` only if setup steps changed, `apps/capi/README.md` (env vars `JWT_SECRET`, `JWT_EXPIRES_IN`, `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`)

- [ ] **Step 1:** Update the docs above (keep each addition short; do not hand-edit `apps/cfe/best-practices.md`).
- [ ] **Step 2:** Run root `npm run typecheck`, `npm run lint`, `npm test`. Expected: all pass.
- [ ] **Step 3:** Manual end-to-end in the browser against the dev stack (`start:docker`, `prisma:seed`, `ng serve`): sign in as the seeded admin using the code logged by `ConsoleEmailSender`, create an invite, accept it in a private window as a second user, create a recurring training, answer as the second user, mark attendance, open stats. Record what you saw; report anything that did not work instead of claiming it did.
- [ ] **Step 4:** Commit: `docs: document members area`. Do not push; ask first.
