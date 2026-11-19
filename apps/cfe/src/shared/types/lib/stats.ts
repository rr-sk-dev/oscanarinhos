import { EventType } from './event';
import { Role } from './member';

export interface MemberStats {
  membershipId: string;
  displayName: string;
  role: Role;
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

/** One saved (or to be saved) attendance mark of a team member for an event. */
export interface AttendanceMark {
  membershipId: string;
  attended: boolean;
}
