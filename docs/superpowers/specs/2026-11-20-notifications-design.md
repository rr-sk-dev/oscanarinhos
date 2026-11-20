# Notifications: cancel and reschedule alerts (project 2 of 3)

Status: draft for approval. Date: 2026-11-20.

## Intent and why

Project 1 (members area, see `2026-11-19-members-availability-design.md`) gave the team a calendar and availability answers. The owner's goal is to replace the WhatsApp group. The piece that still pushes people back to WhatsApp is "tonight's training is off" or "the game moved to 20:00". This project tells members about those changes without anyone posting in a group.

The owner decided:
- Channels: **web push first, email as the fallback**.
- Organisers get a **"notify the team" toggle** on the change.
- Changes the cif.org.pt scraper makes (no organiser, no toggle) notify only on a **cancellation or a real kickoff change**, never on the "overdue, no result yet" postponement noise.

## Goals

- When an event is cancelled or its start time changes, the affected team members are told within seconds.
- A member with a working push subscription gets a push. A member without one gets an email. Never both for the same alert.
- Members turn push on from their phone, per device. Works for the installed PWA on iOS and Android and in desktop browsers.
- Organisers choose whether to alert the team when they cancel or move an event.
- Scraper-driven cancellations and kickoff changes alert the team automatically.

## Non-goals

- Chat (project 3).
- New-event, location-change, note-change, un-cancel, reminder ("training in 2 hours") and "someone answered" alerts. Only cancel and start-time change.
- Per-member notification preferences beyond turning push on or off per device. No email opt-out in this version.
- A notification inbox or history in the app.
- Guaranteed delivery, retries, queues or an audit log.
- Alerts for events already in the past.

## Anti-goals (a failure even if it technically works)

- Alerts sent to members of another team. Recipients are resolved by `teamId` from the event, nothing else.
- Scraper noise: a game marked `POSTPONED` by the scraper because kickoff passed without a result must never alert anyone.
- The same change alerting twice (e.g. the sync re-running, or push and email both firing).
- A slow or failing push provider or email sender delaying or failing the request that changed the event, or the calendar read that triggered a game sync.
- One member's failed delivery stopping delivery to the others.

## Constraints

- Existing stack and layout: NestJS 11, Prisma 7, PostgreSQL 16 in `apps/capi` (module layout, repository abstraction, DTOs, domain exceptions per `apps/capi/AGENTS.md`); Angular 22 zoneless PWA in `apps/cfe` (signal `httpResource` services, container and presentational components, `cui-` kit, pt-PT copy per `apps/cfe/AGENTS.md`). `@canarinhos/shared-types` is hand-maintained and must change together with capi DTOs.
- Reuse the existing `EmailSender` abstraction (`ConsoleEmailSender`, `ResendEmailSender`). Production must keep refusing the console sender.
- The cfe service worker is already registered (`provideServiceWorker`, disabled in dev mode). Push cannot be exercised in dev mode.
- iOS delivers web push only to a PWA added to the home screen (iOS 16.4+).
- The git hooks (lint, typecheck, tests) are the only gate. There is no CI. No `git push` without asking.
- UI and message copy are Portuguese (Portugal), times shown in Europe/Lisbon.

## Approaches considered

| Approach | Trade-off |
|---|---|
| A. `EventsService` and game sync call a `NotificationsService` directly | Simplest. Couples event and sync code to delivery, and a slow provider slows the triggering request. |
| **B. Domain events (chosen)** | Events and sync emit `event.cancelled` and `event.rescheduled` through Nest's event emitter. A notifications listener resolves recipients and delivers. Event and sync code stay unaware of delivery, the scraper filter lives in one place, and sending happens after the request returns. In-process and best-effort: an alert in flight when capi restarts is lost. |
| C. Persisted outbox with a worker | Survives restarts, retries, gives an audit trail. Needs a scheduler and retry rules, more than one team of about 20 people justifies. Can be added behind the same listener later. |

The owner chose B.

## Design

### Triggers

- **Manual edit** (`EventsService.update`): after a successful update, compare the stored event with the result.
  - `status` went `SCHEDULED` to `CANCELED`: emit `event.cancelled`.
  - `startsAt` changed (and the event is not being cancelled in the same patch): emit `event.rescheduled` with the old and new start.
  - Both in one patch: emit `event.cancelled` only.
  - `CANCELED` back to `SCHEDULED` and edits to title, place, notes, respond-by or end time emit nothing.
- **Notify toggle:** the update DTO gains an optional `notifyTeam` boolean, default `false`. It is not stored on the event. The edit form shows the toggle only when the edit would cancel the event or change its start time, switched on by default.
- **Game sync** (`GameSyncService`): when it applies a change to an existing game event, it emits `event.cancelled` if the status went to `CANCELED`, or `event.rescheduled` if `startsAt` changed. It always notifies (no toggle). Because the sync only writes when something differs, a re-run does not re-emit. The status mapping already treats `POSTPONED` as `SCHEDULED`, so the overdue-postponed noise emits nothing.
- Sync runs inside `EventsService.list` (a read request). The emit must not block or fail that read.
- Events whose old and new start are both in the past, and cancellations of events already in the past, emit nothing.

### Recipients

- All members of the event's team (`Membership.teamId`), excluding the person who made the change (for scraper changes, nobody is excluded), excluding anyone whose availability answer for that event is `NO`.
- Resolved per user (a user in two teams is alerted once per event, per the event's team).

### Delivery

Per recipient user, the listener:
1. Sends a push to every stored push subscription of that user.
2. If the user has no subscription, or every send failed, sends an email to the user's address through `EmailSender`.
3. Subscriptions the push service reports as gone (HTTP 404 or 410) are deleted.
4. Every recipient is handled independently. Any error is logged and swallowed. Nothing propagates to the emitter.

Message copy (pt-PT; the builder finalises the wording):
- Cancelled: "Evento cancelado: Treino" / "O evento «Treino» de qua 25 nov, 21:00 foi cancelado."
- Rescheduled: "Novo horário: Jogo" / "O evento «Jogo» passou de sáb 28 nov, 15:00 para sáb 28 nov, 17:00."
- The wording is neutral on purpose: titles vary in gender, and a new start can be earlier as well as later.

Tapping the push opens the event detail screen of that event. The email carries the same text and a link to the event.

### Push subscriptions

- New table `PushSubscription`: id, `userId` (cascade on user delete), `endpoint` (unique), `p256dh`, `auth`, optional user agent, `createdAt`. Subscriptions belong to the user, not a team.
- Authenticated endpoints under the existing `me` module to register and remove the current device's subscription. Registering an endpoint that already exists updates its owner and keys.
- Server uses the `web-push` library and VAPID keys. New env vars `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Required in production (validated at start-up, like the email rule). Optional in development: if absent, push is disabled and everyone gets email through the console sender.
- Server-side sending sits behind an abstraction (a `PushSender`, like `EmailSender`) so tests and development use a fake.

### Frontend

- A "Notificações" control in the members area (builder places it, e.g. profile or settings): shows whether push is on for this device and lets the member turn it on or off, using Angular's `SwPush`.
- Where the browser or platform cannot do push (notably iOS Safari outside the home-screen PWA), the control explains it in pt-PT and says what to do ("Adicionar ao ecrã principal") instead of failing silently.
- Push payloads use Angular's service worker notification format so that tapping the notification opens the event URL with no custom worker code.
- Event edit form: the "Avisar a equipa" toggle described under Triggers.
- Shared types updated for the new DTO field and the subscription payloads.

## Facts about the existing code the builder can rely on

- `Event.teamId` is required and single-valued. `Membership` has no status field (no pending or inactive members). Recipients are exactly the memberships with that `teamId`.
- `Availability` is one row per event and membership, with `YES`, `NO` or `MAYBE`. No row means no answer. It applies to games as well as trainings. Only `NO` is excluded, so `YES`, `MAYBE` and unanswered members are alerted.
- `User.email` is required, unique and stored lowercase. There is no verified flag, so every user has an address for the fallback.
- `EventsService.update` does not run in a transaction. Emit after the repository call returns. Game sync updates one event at a time and emits per event.
- The fixtures scraper skips fixtures without a kickoff time, so a missing time never becomes a `startsAt` change.

## Calls made while reviewing (mine, reversible)

- If game sync moves a game from `CANCELED` back to `SCHEDULED` and the time changes in the same write, nothing is emitted. Un-cancel is silent whatever else changes.
- Any other `startsAt` change in game sync alerts, with no minimum difference. If the federation's data turns out to flap in practice, add a filter later.
- Email links need the frontend origin, so there is a new env var `FRONTEND_URL`, required in production alongside the VAPID keys and the email settings.
- A push counts as failed only when the send throws or times out. In that rare case the member may get an email for a push that arrived late. Accepted.

## Left to the builder

- The exact module name and file layout, the event names' TypeScript typing, and how the public VAPID key reaches the frontend (environment file or endpoint).
- Message wording and the date formatting helper, within pt-PT and Europe/Lisbon.
- Email subject and body format.
- Where the notifications control lives in the members area, and its visual design within the `cui-` kit.
- Test strategy, following existing patterns (hand-built mocks, `HttpTestingController` for services and components). Delivery rules (recipient filtering, push then email fallback, 410 cleanup, error isolation, scraper filter) need unit tests.
- How to verify push end to end, given the service worker is off in dev mode.

## Owner calls to confirm (my defaults, reversible)

- Members who answered "no" are not alerted.
- The person who made the change is not alerted about their own change.
- No email opt-out, and un-cancelling and location changes are silent.
- The `notifyTeam` toggle defaults to on in the form and to off in the API.
- Alerts are lost if capi restarts mid-send.
