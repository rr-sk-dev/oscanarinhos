export type EventType = 'TRAINING' | 'GAME' | 'CUSTOM';
export type EventStatus = 'SCHEDULED' | 'CANCELED';

export interface CalendarEvent {
  id: string;
  teamId: string;
  type: EventType;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  notes: string | null;
  respondBy: string | null;
  status: EventStatus;
  matchId: string | null;
  seriesId: string | null;
}

export interface CreateEventInput {
  type: Exclude<EventType, 'GAME'>;
  title: string;
  startsAt: string;
  endsAt?: string;
  location?: string;
  notes?: string;
  respondBy?: string;
}
