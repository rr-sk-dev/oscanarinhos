export const EVENT_CANCELLED = 'event.cancelled';
export const EVENT_RESCHEDULED = 'event.rescheduled';

export interface EventChangedPayload {
  teamId: string;
  eventId: string;
  title: string;
  location: string | null;
  previousStartsAt: Date;
  startsAt: Date;
  actorUserId: string | null;
}
