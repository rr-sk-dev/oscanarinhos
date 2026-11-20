# Notifications Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tell team members, by web push with an email fallback, when an event is cancelled or its start time changes.

**Architecture:** `EventsService.update` and `GameSyncService` detect a cancellation or start-time change with one shared pure function and emit a Nest domain event. A notifications listener resolves recipients, sends push to each device, and falls back to email. Sending happens after the request returns and never fails it.

**Tech Stack:** NestJS 11, Prisma 7, PostgreSQL 16, `@nestjs/event-emitter`, `web-push`; Angular 22 zoneless PWA, `SwPush`, Tailwind v4.

**Spec:** `docs/superpowers/specs/2026-11-20-notifications-design.md`

## Global Constraints

- Conventional Commits, enforced by commitlint. **No AI attribution lines** in commit messages or PR text (`rules/commits.md`). Never `git push` without asking.
- Always braces on `if`/`else`/`for`/`while`/`do` (`rules/code-style.md`). Fat services, thin controllers, DTOs validated with class-validator, Prisma only behind repositories, depend on abstractions via Nest DI.
- Shell: absolute paths, never `cd`. Run scripts as `npm --prefix /Users/ruben.rodrigues/Documents/projects/oscanarinhos/apps/<capi|cfe> run <script>`. Run `prisma:generate` in capi after any schema change.
- pre-commit runs lint-staged, typecheck and all tests, so each commit must leave all three green.
- UI and message copy: Portuguese (Portugal), times in Europe/Lisbon.
- Every recipient lookup is scoped by the event's `teamId`. Push and email are never both sent for one alert to one user.
- Alerts only for: `SCHEDULED` to `CANCELED`, and a `startsAt` change on a still-`SCHEDULED` event. Un-cancel (`CANCELED` to `SCHEDULED`), location, notes, title, end and respond-by changes emit nothing. Nothing for events entirely in the past.
- Production requires `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and `FRONTEND_URL` (validated at start-up like the email rule). In development they are optional; without VAPID keys push is disabled and everyone gets email through the console sender.
- Branch from a freshly fetched `dev` (see memory note on fetching over HTTPS), e.g. `feat/notifications`.

## Review Focus

1. A game the scraper marks `POSTPONED` (overdue, no result) alerts nobody (Task 3).
2. Re-running game sync after it already applied a change alerts nobody a second time (Task 3).
3. A cancellation or move of an event whose times are all in the past alerts nobody (Task 1).
4. A user who belongs to two teams is alerted only through the event's own team, and the actor and "no" answerers are skipped (Task 8).
5. A user with two devices where one push fails and one succeeds gets no email. A dead subscription (404/410) is deleted. One recipient throwing never stops the others, and a throwing listener never fails the update or the calendar read (Tasks 2, 9).

## File Structure

capi (`apps/capi/src`):
- `events/event-change.ts`: pure `detectEventChange`. `events/types/event-change.events.ts`: event names and payload.
- `events/events.service.ts`, `events/game-sync.service.ts`, `events/events.controller.ts`, `events/types/event.dto.ts`: modified to emit.
- `email/email.module.ts`: new, owns the `EmailSender` provider moved out of `auth/auth.module.ts`.
- `push/`: `push-subscription.repository.ts`, `push-subscription-prisma.repository.ts`, `push-sender.ts` (abstract), `web-push-sender.ts`, `disabled-push-sender.ts`, `push.module.ts`.
- `me/`: push-subscription endpoints on `MeController` plus a `PushSubscriptionsService`.
- `notifications/`: `notification-messages.ts` (pure copy), `recipient-resolver.service.ts`, `notification-delivery.service.ts`, `event-change.listener.ts`, `notifications.module.ts`.
- `prisma/schema.prisma` and one new migration.

cfe (`apps/cfe/src`):
- `shared/types/index.ts`: types for the new payloads.
- `members/event/event.service.ts`, `members/event/event-form/*`: notify toggle.
- `members/notifications/`: `push.service.ts` and a presentational control, placed in the members area (builder picks the spot).
- `environments/environment*.ts`: `vapidPublicKey`.

---

### Task 1: Detect a notifiable event change

**Files:**
- Create: `apps/capi/src/events/event-change.ts`, `apps/capi/src/events/event-change.spec.ts`, `apps/capi/src/events/types/event-change.events.ts`

**Interfaces:**
- Produces:
  - `type EventChangeKind = 'cancelled' | 'rescheduled'`
  - `detectEventChange(before: EventEntity, after: EventEntity, now: Date): EventChangeKind | null`
  - in `event-change.events.ts`: `EVENT_CANCELLED = 'event.cancelled'`, `EVENT_RESCHEDULED = 'event.rescheduled'`, and `interface EventChangedPayload { teamId: string; eventId: string; title: string; location: string | null; previousStartsAt: Date; startsAt: Date; actorUserId: string | null }`.

- [ ] **Step 1: Write failing tests** in `event-change.spec.ts`, one `it` each: SCHEDULED to CANCELED with future start returns `'cancelled'`; CANCELED to CANCELED returns `null`; CANCELED to SCHEDULED returns `null`; CANCELED to SCHEDULED with a different `startsAt` returns `null`; startsAt differs on SCHEDULED/SCHEDULED with a future new start returns `'rescheduled'`; old start in the future and new start in the past returns `'rescheduled'`; both starts in the past returns `null`; cancelling an event whose `startsAt` is in the past returns `null`; SCHEDULED to CANCELED plus a different `startsAt` returns `'cancelled'`; only title/location/notes changed returns `null`.
- [ ] **Step 2:** Run `npm --prefix /Users/ruben.rodrigues/Documents/projects/oscanarinhos/apps/capi test -- src/events/event-change.spec.ts`. Expected: FAIL, module not found.
- [ ] **Step 3: Implement** `detectEventChange` and the events file with the signatures above.
- [ ] **Step 4:** Re-run the spec. Expected: PASS.
- [ ] **Step 5: Commit** `feat(capi): detect notifiable event changes`.

### Task 2: Emit from manual edits, with the notify toggle

**Files:**
- Modify: `apps/capi/package.json` (add `@nestjs/event-emitter`), `apps/capi/src/app.module.ts` (`EventEmitterModule.forRoot()`), `apps/capi/src/events/types/event.dto.ts`, `apps/capi/src/events/events.service.ts`, `apps/capi/src/events/events.controller.ts`, `apps/capi/src/events/events.module.ts`
- Test: `apps/capi/src/events/events.service.spec.ts`, `apps/capi/src/events/event.dto.spec.ts`, `apps/capi/src/events/events.controller.spec.ts`

**Interfaces:**
- Consumes: Task 1 (`detectEventChange`, `EVENT_CANCELLED`, `EVENT_RESCHEDULED`, `EventChangedPayload`), `Clock` from `availability/clock.ts` (already exported by `AvailabilityDataModule`, already imported by `EventsModule`).
- Produces:
  - `UpdateEventDto.notifyTeam?: boolean` (`@IsOptional() @IsBoolean()`, never stored).
  - `EventsService.update(teamId: string, eventId: string, patch: UpdateEventDto, actorUserId: string): Promise<EventEntity>`. `EventsService` now injects `EventEmitter2` and `Clock`.

- [ ] **Step 1: Write failing tests.** In `events.service.spec.ts` (hand-built `EventEmitter2` mock, fixed `Clock`): cancel with `notifyTeam: true` emits `event.cancelled` once with the payload (`actorUserId` = the argument, `previousStartsAt` = old start); cancel without `notifyTeam` emits nothing; `notifyTeam: false` emits nothing; moving `startsAt` with `notifyTeam: true` emits `event.rescheduled` with old and new start; cancel plus move in one patch emits only `event.cancelled`; a title-only edit with `notifyTeam: true` emits nothing; the emit happens after the repository update resolves; if `emit` throws, `update` still returns the updated event. In `event.dto.spec.ts`: `notifyTeam: 'yes'` is rejected, and a `GAME` patch containing `notifyTeam` still raises `EventGameReadonlyException` (it is not added to `GAME_EDITABLE_FIELDS`).
- [ ] **Step 2:** Run both specs. Expected: FAIL.
- [ ] **Step 3: Implement.** Install the package with `npm --prefix ... install @nestjs/event-emitter`. After a successful repository update, call `detectEventChange(event, updated, clock.now())` and, only when `patch.notifyTeam === true` and a kind is returned, emit inside a `try/catch` that logs. Pass `membership.userId` from the controller (`@CurrentMembership()` is already there). Update the controller spec for the new argument.
- [ ] **Step 4:** Run `npm --prefix .../apps/capi test` and `typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(capi): emit event.cancelled and event.rescheduled on manual edits`.

### Task 3: Emit from game sync

**Files:**
- Modify: `apps/capi/src/events/game-sync.service.ts`, `apps/capi/src/events/events.module.ts` (nothing new to import)
- Test: `apps/capi/src/events/game-sync.service.spec.ts`

**Interfaces:**
- Consumes: Task 1, `EventEmitter2` (global), `Clock`. `GameSyncService` constructor gains `EventEmitter2` and `Clock`.

- [ ] **Step 1: Write failing tests** (existing spec's mocks): match status `CANCELED` against a `SCHEDULED` event emits `event.cancelled` with `actorUserId: null` after the repository update; a changed `kickoffAt` emits `event.rescheduled`; match status `POSTPONED` against a `SCHEDULED` event updates nothing and emits nothing; running `syncTeam` twice against the same data emits once in total (second run's event already matches); `CANCELED` event with match back to `SCHEDULED` and a new kickoff emits nothing; a newly created game event emits nothing; a throwing `emit` does not make `syncTeam` reject.
- [ ] **Step 2:** Run the spec. Expected: FAIL.
- [ ] **Step 3: Implement.** In `syncMatch`, after the `update` call, build the updated entity as `{ ...event, ...changes }`, call `detectEventChange(event, updated, clock.now())` and emit in a logged `try/catch`. Never `await` anything beyond the emit's synchronous return.
- [ ] **Step 4:** Run the capi suite and typecheck. Expected: PASS.
- [ ] **Step 5: Commit** `feat(capi): emit change events from game sync`.

### Task 4: Push subscription storage

**Files:**
- Modify: `apps/capi/prisma/schema.prisma` (new model, `pushSubscriptions PushSubscription[]` on `User`), new migration under `apps/capi/prisma/migrations/`
- Create: `apps/capi/src/push/push-subscription.repository.ts`, `push-subscription-prisma.repository.ts`, `push-subscription.entity.ts`, `push.module.ts`

**Interfaces:**
- Produces: `PushSubscriptionEntity { id: string; userId: string; endpoint: string; p256dh: string; auth: string; userAgent: string | null }`, and abstract `PushSubscriptionRepository`:
  - `upsertByEndpoint(data: { userId: string; endpoint: string; p256dh: string; auth: string; userAgent: string | null }): Promise<PushSubscriptionEntity>` (existing endpoint updates owner and keys)
  - `findByUserId(userId: string): Promise<PushSubscriptionEntity[]>`
  - `deleteByEndpoint(endpoint: string): Promise<void>` (no error when absent)
  - `deleteByEndpointForUser(userId: string, endpoint: string): Promise<void>`
  - Model: `id` uuid, `userId` (cascade), `endpoint` unique, `p256dh`, `auth`, `userAgent?`, `createdAt`, index on `userId`.

- [ ] **Step 1:** Edit the schema, run `npm --prefix .../apps/capi run prisma:generate`, create the migration with Prisma's `migrate dev --name push_subscriptions` against the local DB. If the DB is unavailable, write the SQL by hand in the same style as `20261119161014_members_events_availability` and say so in the commit body.
- [ ] **Step 2: Write failing tests** for `PrismaPushSubscriptionRepository` following the pattern of `availability-prisma.repository.ts` specs (mock delegate): upsert calls `upsert` keyed on `endpoint` and moves ownership; `findByUserId` filters by user; the two deletes do not throw when `deleteMany` returns count 0.
- [ ] **Step 3:** Run them, expect FAIL. Implement the repository with `DatabaseModule.forFeature('pushSubscription')` in `PushModule`, exporting `PushSubscriptionRepository`.
- [ ] **Step 4:** Run the capi suite and typecheck. Expected: PASS.
- [ ] **Step 5: Commit** `feat(capi): store push subscriptions`.

### Task 5: Push sender and configuration

**Files:**
- Modify: `apps/capi/package.json` (`web-push` and `@types/web-push`), `apps/capi/src/core/environment/env-config.ts`, `apps/capi/src/core/environment/env-validator.ts`, `apps/capi/src/push/push.module.ts`, `apps/capi/AGENTS.md` (env var and production-checklist docs), `apps/capi/env/development.env` if the repo tracks an example
- Create: `apps/capi/src/push/push-sender.ts`, `web-push-sender.ts`, `disabled-push-sender.ts`
- Test: `apps/capi/src/core/environment/env-validator.spec.ts`, `apps/capi/src/push/web-push-sender.spec.ts`

**Interfaces:**
- Produces:
  - `interface PushPayload { title: string; body: string; url: string }`
  - `type PushResult = 'sent' | 'gone' | 'failed'`
  - `abstract class PushSender { abstract readonly isEnabled: boolean; abstract send(subscription: PushSubscriptionEntity, payload: PushPayload): Promise<PushResult> }`. `'gone'` means HTTP 404 or 410; any other error or timeout is `'failed'`.
  - Env: `VAPID_PUBLIC_KEY?`, `VAPID_PRIVATE_KEY?`, `VAPID_SUBJECT?`, `FRONTEND_URL?` (`@IsUrl`), each required when `NODE_ENV === production`.
  - `PushModule` provides `PushSender` as `WebPushSender` when both VAPID keys are set, else `DisabledPushSender` (`isEnabled = false`, `send` returns `'failed'`).

- [ ] **Step 1: Write failing tests.** Validator: production without each of the four vars fails with a message naming it; development without them passes. `WebPushSender` (mock the `web-push` module): success returns `'sent'`; a rejection with `statusCode` 410 and 404 returns `'gone'`; 500 and a network error return `'failed'`; the payload sent is the Angular service-worker format `{"notification": {"title", "body", "data": {"onActionClick": {"default": {"operation": "navigateLastFocusedOrOpen", "url": <payload.url>}}}}}`; a timeout option is passed (10 seconds).
- [ ] **Step 2:** Run both, expect FAIL.
- [ ] **Step 3: Implement.** Use `webpush.sendNotification(subscription, JSON.stringify(...), { vapidDetails, timeout })`. Document how to generate keys (`npx web-push generate-vapid-keys`) in `apps/capi/AGENTS.md`.
- [ ] **Step 4:** Run the capi suite and typecheck. Expected: PASS.
- [ ] **Step 5: Commit** `feat(capi): add web push sender and VAPID configuration`.

### Task 6: Register and remove push subscriptions

**Files:**
- Modify: `apps/capi/src/me/me.controller.ts`, `apps/capi/src/me/me.module.ts` (import `PushModule`), `apps/capi/src/me/types/me.dto.ts`
- Create: `apps/capi/src/me/push-subscriptions.service.ts`
- Test: `apps/capi/src/me/push-subscriptions.service.spec.ts`, a DTO spec alongside `me.dto.ts`

**Interfaces:**
- Consumes: Task 4 repository.
- Produces: `POST /me/push-subscriptions` body `RegisterPushSubscriptionDto { endpoint: string (IsUrl); keys: { p256dh: string; auth: string } }` returns 204; `DELETE /me/push-subscriptions` body `{ endpoint: string }` returns 204. Both behind `JwtAuthGuard`. `PushSubscriptionsService.register(userId: string, dto: RegisterPushSubscriptionDto, userAgent: string | null): Promise<void>` and `.unregister(userId: string, endpoint: string): Promise<void>`.

- [ ] **Step 1: Write failing tests:** register calls `upsertByEndpoint` with the user's id and the `User-Agent` header; unregister calls `deleteByEndpointForUser` (never `deleteByEndpoint`, so a user cannot remove another user's device); the DTO rejects a missing `keys.auth` and a non-URL endpoint.
- [ ] **Step 2:** Run them, expect FAIL. **Step 3:** Implement with a controller that only orchestrates.
- [ ] **Step 4:** Run the capi suite and typecheck. Expected: PASS.
- [ ] **Step 5: Commit** `feat(capi): add push subscription endpoints`.

### Task 7: Shared email module and notification copy

**Files:**
- Create: `apps/capi/src/email/email.module.ts`, `apps/capi/src/notifications/notification-messages.ts`, `apps/capi/src/notifications/notification-messages.spec.ts`
- Modify: `apps/capi/src/auth/auth.module.ts` (import `EmailModule`, drop the inline provider)

**Interfaces:**
- Produces: `EmailModule` exporting `EmailSender` (same factory as today). And
  - `interface NotificationMessage { title: string; body: string }`
  - `buildNotificationMessage(kind: EventChangeKind, change: { title: string; startsAt: Date; previousStartsAt: Date }): NotificationMessage`
  - `buildEmailContent(message: NotificationMessage, eventUrl: string): { subject: string; body: string }` (subject is the title, body is the message text plus the link).

- [ ] **Step 1: Write failing tests** for copy, with dates formatted in Europe/Lisbon (include a winter and a summer date to pin the offset): cancelled text names the event and its day/time; rescheduled text states old and new time; email body contains the URL. The event title is used verbatim, so the builder fixes the exact pt-PT sentences (the spec's examples are a guide) and the tests pin them.
- [ ] **Step 2:** Run, expect FAIL. **Step 3:** Implement with `Intl.DateTimeFormat('pt-PT', { timeZone: 'Europe/Lisbon', ... })`. Move the `EmailSender` provider into `EmailModule` unchanged.
- [ ] **Step 4:** Run the capi suite (the auth specs must still pass) and typecheck. Expected: PASS.
- [ ] **Step 5: Commit** `refactor(capi): extract email module and add notification copy`.

### Task 8: Resolve recipients

**Files:**
- Create: `apps/capi/src/notifications/recipient-resolver.service.ts` and its spec

**Interfaces:**
- Consumes: `MembershipRepository.findByTeam`, `AvailabilityRepository.findByEvent`, `UserRepository.findById`.
- Produces: `interface NotificationRecipient { userId: string; email: string }` and `RecipientResolver.resolve(teamId: string, eventId: string, actorUserId: string | null): Promise<NotificationRecipient[]>`.

- [ ] **Step 1: Write failing tests** (hand-built repository mocks): members with `YES`, `MAYBE` and no answer are included; a `NO` answer is excluded; the actor's user is excluded and a `null` actor excludes nobody; one user holding two memberships in the same team appears once; only `findByTeam(teamId)` results are used, so a user known only in another team is never returned; an unknown user id is skipped.
- [ ] **Step 2:** Run, expect FAIL. **Step 3:** Implement. Import the needed data modules in `NotificationsModule` (Task 9).
- [ ] **Step 4:** Run the capi suite. Expected: PASS.
- [ ] **Step 5: Commit** `feat(capi): resolve notification recipients`.

### Task 9: Deliver alerts and listen for events

**Files:**
- Create: `apps/capi/src/notifications/notification-delivery.service.ts`, `event-change.listener.ts`, `notifications.module.ts`, and specs for both
- Modify: `apps/capi/src/app.module.ts` (import `NotificationsModule`)

**Interfaces:**
- Consumes: Tasks 1, 5, 7, 8, `PushSubscriptionRepository`, `PushSender`, `EmailSender`, `ConfigService` (`FRONTEND_URL`).
- Produces: `NotificationDeliveryService.deliver(recipient: NotificationRecipient, message: NotificationMessage, eventUrl: string): Promise<'push' | 'email' | 'none'>` and `EventChangeListener` with `@OnEvent(EVENT_CANCELLED, { async: true })` and `@OnEvent(EVENT_RESCHEDULED, { async: true })` handlers taking `EventChangedPayload`. The event URL is `${FRONTEND_URL}/members/events/${eventId}`.

- [ ] **Step 1: Write failing tests.** Delivery: no subscriptions returns `'email'` and sends one email, no push; two subscriptions where one is `'sent'` and one `'failed'` returns `'push'` and sends no email; all `'failed'` returns `'email'`; a `'gone'` result deletes that endpoint via `deleteByEndpoint`; a `'gone'` plus `'sent'` returns `'push'`; a throwing email sender returns `'none'` and does not throw; when `PushSender.isEnabled` is false subscriptions are ignored and email is sent. Listener: resolves recipients for the payload's team/event/actor, delivers to each, one recipient's delivery throwing does not stop the rest, a throwing resolver does not propagate, and the message kind matches the event name.
- [ ] **Step 2:** Run, expect FAIL. **Step 3:** Implement. Deliver to recipients sequentially or with `Promise.allSettled`, builder's choice; log every failure with the user id, never the endpoint or keys.
- [ ] **Step 4:** Run the capi suite, `typecheck` and `lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(capi): deliver cancel and reschedule alerts`.

### Task 10: Notify toggle in the edit form (cfe)

**Files:**
- Modify: `apps/cfe/src/shared/types/index.ts` (`UpdateEventRequest` gains `notifyTeam?: boolean` if such a type exists, otherwise none), `apps/cfe/src/members/event/event-form/event-form.ts`, `event-form.html`, `event-form.spec.ts`, `apps/cfe/src/members/event/event.service.ts` only if the patch body is built there

**Interfaces:**
- Consumes: capi `UpdateEventDto.notifyTeam` (Task 2).

- [ ] **Step 1: Write failing tests** in `event-form.spec.ts`: in edit mode, changing the start time reveals an "Avisar a equipa" toggle, on by default, and submitting sends `notifyTeam: true`; switching it off sends `notifyTeam: false`; editing only title or location shows no toggle and sends no `notifyTeam`; the cancel confirmation shows the toggle, on by default, and confirming sends `{ status: 'CANCELED', notifyTeam: true }`; `GAME` events show no toggle.
- [ ] **Step 2:** Run `npm --prefix .../apps/cfe test -- src/members/event/event-form/event-form.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement with a `notifyTeam` signal reset when the form loads, shown through a `cui-` toggle or checkbox consistent with the form.
- [ ] **Step 4:** Run the cfe suite and `typecheck`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(cfe): let organisers notify the team on cancel or reschedule`.

### Task 11: Turn push on for this device (cfe)

**Files:**
- Create: `apps/cfe/src/members/notifications/push.service.ts`, `push.service.spec.ts`, a presentational control component and its spec
- Modify: `apps/cfe/src/environments/environment.ts` and `environment.production.ts` (`vapidPublicKey: string`), the members screen chosen for the control and its spec, `apps/cfe/src/shared/types/index.ts`

**Interfaces:**
- Produces: `PushService` (root service) with `status: Signal<'unsupported' | 'needs-install' | 'blocked' | 'off' | 'on'>`, `enable(): Promise<void>`, `disable(): Promise<void>`. `enable` calls `SwPush.requestSubscription({ serverPublicKey })` then `POST /api/me/push-subscriptions`. `disable` calls `unsubscribe()` then `DELETE /api/me/push-subscriptions`. The control takes `status` as an input and emits `enable` and `disable`; the container wires it to `PushService`.

- [ ] **Step 1: Write failing tests** (mock `SwPush`, `HttpTestingController`): `status` is `'unsupported'` when `SwPush.isEnabled` is false and not iOS-in-browser, `'needs-install'` on iOS Safari outside standalone mode, `'blocked'` when `Notification.permission === 'denied'`, `'on'` when a subscription exists; `enable` posts `{ endpoint, keys: { p256dh, auth } }` with keys base64-encoded from `PushSubscription.toJSON()`; `disable` unsubscribes then sends the endpoint to DELETE; a failed POST leaves status `'off'` and surfaces an error message. Control spec: each status renders the right pt-PT text, and `'needs-install'` mentions "Adicionar ao ecrã principal".
- [ ] **Step 2:** Run the new specs, expect FAIL. **Step 3:** Implement. Set a real public key in `environment.production.ts` only once the owner has generated one; use an obvious placeholder in `environment.ts` and say so in the commit body.
- [ ] **Step 4:** Run the cfe suite, `typecheck` and `lint`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(cfe): let members turn push notifications on per device`.

### Task 12: Verify end to end and record the rollout

**Files:**
- Modify: `apps/capi/AGENTS.md` and `apps/cfe/AGENTS.md` if a convention changed; add a short note on production steps to the plan's PR description

- [ ] **Step 1:** Run `npm --prefix /Users/ruben.rodrigues/Documents/projects/oscanarinhos run typecheck`, `test` and `lint` at the repo root. Expected: all green.
- [ ] **Step 2:** Serve a production cfe build (service worker is off in dev mode) against capi with generated VAPID keys, console email, and `FRONTEND_URL` set. Subscribe a desktop browser, cancel a training with the toggle on, and confirm a push arrives and tapping it opens `/members/events/:id`. Then remove the subscription and confirm the console sender logs the email.
- [ ] **Step 3:** In that run, edit only a title, cancel with the toggle off, and flip a game to `POSTPONED` in the database; confirm none of them alert anyone.
- [ ] **Step 4:** Record the production checklist in the PR description: run `prisma migrate deploy`, set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` and `FRONTEND_URL`, set `vapidPublicKey` in `environment.production.ts`.
- [ ] **Step 5: Commit** any doc changes as `docs: document notification rollout`.
