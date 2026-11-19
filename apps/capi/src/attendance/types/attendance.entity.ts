import { EventStatus, EventType } from '../../events/types/event.entity';

export interface AttendanceEntry {
  membershipId: string;
  attended: boolean;
}

/** One marked attendance joined with the event it belongs to. */
export interface AttendanceRecord {
  eventId: string;
  membershipId: string;
  attended: boolean;
  eventType: EventType;
  eventStatus: EventStatus;
  eventStartsAt: Date;
}

export interface MemberStats {
  membershipId: string;
  displayName: string;
  role: 'ADMIN' | 'COACH' | 'PLAYER' | 'STAFF';
  markedEvents: number;
  attended: number;
  attendancePercent: number;
}

export interface TypeStats {
  type: EventType;
  events: number;
  averageAttended: number;
}

export interface TeamStats {
  members: MemberStats[];
  byType: TypeStats[];
}
