# Members area: accounts, calendar and availability (project 1 of 3)

Status: draft for approval. Date: 2026-11-19.

## Intent and why

Os Canarinhos is today a public, read-only fan site for one team. The owner wants the app to become a team-management tool like Spond, TeamSnap or Heja, first to run their own team and replace the WhatsApp group, with the possibility of becoming a product for other teams later.

Three features were asked for, built as three separate projects in this order:

1. **Accounts, calendar and availability (this document).**
2. Notifications (cancel or reschedule alerts, with a "notify the team" toggle). Out of scope here.
3. In-app chat. Out of scope here.

The public fan site (results, squad, news, live) stays as it is. The members area sits beside it.

## Goals

- Members sign in and belong to a team through a role-based membership.
- A team calendar of trainings, games and custom events, with recurring trainings.
- Every member, including staff and delegates, can answer yes, no or maybe for an event, with an optional note.
- Coaches see at a glance who is coming, who isn't and who hasn't answered.
- Attendance statistics: per-player attendance percentage and team turnout by event type.
- Games from the existing cif.org.pt scrape appear in the calendar automatically.
- Team-scoped from day one, so another team can be added later without reworking the data model.

## Non-goals

- Notifications and chat (projects 2 and 3).
- Self-serve team creation, billing, per-team branding or payments.
- A ranking or leaderboard of players by attendance. The stats page is informational.
- Replacing the public site.

## Anti-goals (a failure even if it technically works)

- Data that is not scoped to a team: every event, response and membership must carry a `teamId`, and every query must filter by it.
- Players needing passwords or a long onboarding to answer "do I go on Tuesday?".
- Games entered twice, once by the scraper and once by hand.

## Constraints

- Existing stack: NestJS 11 + Prisma 7 + PostgreSQL 16 (`apps/capi`) and Angular 22 zoneless PWA with Tailwind v4 (`apps/cfe`). Follow the module layout in `apps/capi/AGENTS.md` (repository abstraction, Prisma implementation, entity/DTO/mapper, domain exceptions) and the frontend conventions in `apps/cfe/AGENTS.md` (signal `httpResource` services, container and presentational components, `cui-` UI kit, pt-PT copy).
- Today all `/api` routes are public and there are no auth guards. This project introduces the first authentication. Existing public routes must remain public.
- `@canarinhos/shared-types` is maintained by hand and must be updated together with capi DTOs.
- The git hooks (lint, typecheck, tests) are the only gate. There is no CI.
- UI copy is Portuguese (Portugal).

## Approaches considered

| Approach | Trade-off |
|---|---|
| A. Single team only | Fastest, but becoming a product later means rewriting the data model and every query. |
| **B. Team-scoped from day one (chosen)** | Every event, response and membership belongs to a team. Users join through a role-based membership. Admins invite by link or code. No self-serve team creation yet. Slightly more work now; `Team` already exists, so adding teams later is mostly a new screen. |
| C. Full multi-tenant product | Self-serve creation, billing, branding. Too much for a single team. |

The owner chose B.

## Design

### Roles and membership
- New `Membership`: user, team, role (`ADMIN`, `COACH`, `PLAYER`, `STAFF`), optional link to an existing `Player` or `TeamStaff` record.
- `ADMIN` and `COACH` create and edit events and mark attendance. `ADMIN` also invites and removes members. `PLAYER` and `STAFF` (delegates and other staff) respond to events.
- Linking a membership to a `Player` or `TeamStaff` record keeps the account and the public squad pages aligned.

### Authentication (builder's call within these bounds)
- Passwordless: an email code or magic link. No passwords stored.
- Invites are a link or code created by an admin, bound to a team and a role.
- Authenticated requests carry a token; guards check membership and role per team. Public routes stay unguarded.

### Events
- Types: `TRAINING`, `GAME`, `CUSTOM`. Fields: title, start, optional end, place, notes, optional respond-by deadline, status (scheduled or cancelled), `teamId`.
- **Games:** the scraper's `Match` is the source of truth. A game event references the `Match` rather than copying it, so reschedules from the scrape flow through and nothing is entered twice. Only our team's matches appear.
- **Recurring trainings:** created once as a series (e.g. Tuesday and Thursday 21:00 until a date). Single occurrences can be moved or cancelled without altering the series.

### Availability
- Each member answers `YES`, `NO` or `MAYBE` with an optional short note (e.g. "late by 20 minutes"), changeable until the event starts.
- The event page lists responses grouped as going, maybe, not going and no answer, with counts. Coaches see this at a glance.

### Attendance and stats
- After an event, a coach or admin marks who actually attended. This is separate from the availability answer.
- Stats page: attendance percentage per member and team turnout per event type, over a selectable period (default: current season). Informational only.

### Frontend
- A new members area alongside the public tabs, shown after sign-in. Screens: sign-in and invite acceptance, calendar (list and month views), event detail with the response buttons and response list, create and edit event, attendance marking, stats.
- Event detail sketch:
```
Treino · Ter 21:00 · Campo do Jamor
Vão (11)   Talvez (2)   Não (3)   Sem resposta (4)
[ Vou ]  [ Talvez ]  [ Não vou ]
```

## Left to the builder

- Token mechanism and email delivery provider for sign-in codes.
- Exact schema, indices and migration order.
- How recurrence is stored and expanded (rule plus exceptions versus materialised occurrences).
- Calendar layout details within the existing `cui-` kit.
- Test strategy, following the existing patterns (hand-built mocks for services, `HttpTestingController` for components).

## Open items for the owner

None blocking. Assumptions that are my calls and can be reversed: passwordless sign-in, response options yes/no/maybe with a note, a respond-by deadline, attendance marked separately by coaches, and stats defaulting to the current season.
