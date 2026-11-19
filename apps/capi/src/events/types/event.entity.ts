export const EVENT_TYPES = ['TRAINING', 'GAME', 'CUSTOM'] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_STATUSES = ['SCHEDULED', 'CANCELED'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

export interface EventEntity {
  id: string;
  teamId: string;
  type: EventType;
  title: string;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  notes: string | null;
  respondBy: Date | null;
  status: EventStatus;
  matchId: string | null;
  seriesId: string | null;
}

export type CreateEventData = Omit<EventEntity, 'id' | 'status' | 'matchId' | 'seriesId'> &
  Partial<Pick<EventEntity, 'status' | 'matchId' | 'seriesId'>>;

export type UpdateEventData = Partial<
  Pick<EventEntity, 'title' | 'startsAt' | 'endsAt' | 'location' | 'notes' | 'respondBy' | 'status'>
>;
