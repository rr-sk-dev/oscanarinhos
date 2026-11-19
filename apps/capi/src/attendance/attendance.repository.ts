import { AttendanceEntry, AttendanceRecord } from './types/attendance.entity';

/**
 * Callers resolve the event through the team-scoped EventRepository first; `upsertMany` takes
 * an event id already verified to belong to the team.
 */
export abstract class AttendanceRepository {
  /** Insert or update on (eventId, membershipId). */
  abstract upsertMany(eventId: string, entries: AttendanceEntry[]): Promise<void>;
  /** Saved marks of one event, already verified to belong to the team. */
  abstract findByEvent(eventId: string): Promise<AttendanceEntry[]>;
  /** Marked attendance of the team's events with startsAt in [from, to), any status. */
  abstract findByTeamBetween(teamId: string, from: Date, to: Date): Promise<AttendanceRecord[]>;
}
