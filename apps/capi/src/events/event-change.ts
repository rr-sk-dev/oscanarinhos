import { EventEntity } from './types/event.entity';

export type EventChangeKind = 'cancelled' | 'rescheduled';

export function detectEventChange(
  before: EventEntity,
  after: EventEntity,
  now: Date,
): EventChangeKind | null {
  if (before.status === 'SCHEDULED' && after.status === 'CANCELED') {
    return after.startsAt > now ? 'cancelled' : null;
  }

  const isStillScheduled = before.status === 'SCHEDULED' && after.status === 'SCHEDULED';
  const hasStartChanged = before.startsAt.getTime() !== after.startsAt.getTime();
  const isRelevantToTeam = before.startsAt > now || after.startsAt > now;

  if (isStillScheduled && hasStartChanged && isRelevantToTeam) {
    return 'rescheduled';
  }

  return null;
}
