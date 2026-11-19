import { Injectable } from '@nestjs/common';
import { EventRepository } from '../events/event.repository';
import { EventNotFoundException } from '../events/exceptions/event.exceptions';
import { MembershipRepository } from '../members/membership.repository';
import { MembershipNotFoundException } from '../members/exceptions/members.exceptions';
import { AttendanceRepository } from './attendance.repository';
import {
  EventCanceledForbiddenException,
  EventNotStartedForbiddenException,
} from './exceptions/attendance.exceptions';
import { AttendanceEntry } from './types/attendance.entity';

/** Concurrent upserts of the same row are racy, so a repeated membership keeps its last entry. */
function lastEntryPerMembership(entries: AttendanceEntry[]): AttendanceEntry[] {
  const byMembership = new Map<string, AttendanceEntry>();
  for (const entry of entries) {
    byMembership.set(entry.membershipId, entry);
  }
  return [...byMembership.values()];
}

@Injectable()
export class AttendanceService {
  constructor(
    private readonly events: EventRepository,
    private readonly memberships: MembershipRepository,
    private readonly attendances: AttendanceRepository,
  ) {}

  async mark(
    teamId: string,
    eventId: string,
    entries: AttendanceEntry[],
    now: Date,
  ): Promise<void> {
    const event = await this.events.findByIdInTeam(teamId, eventId);
    if (!event) {
      throw new EventNotFoundException();
    }
    if (event.status === 'CANCELED') {
      throw new EventCanceledForbiddenException();
    }
    if (event.startsAt > now) {
      throw new EventNotStartedForbiddenException();
    }

    const teamMembers = await this.memberships.findByTeam(teamId);
    const teamMembershipIds = new Set(teamMembers.map((member) => member.id));
    if (entries.some((entry) => !teamMembershipIds.has(entry.membershipId))) {
      throw new MembershipNotFoundException();
    }

    await this.attendances.upsertMany(eventId, lastEntryPerMembership(entries));
  }

  async list(teamId: string, eventId: string): Promise<AttendanceEntry[]> {
    const event = await this.events.findByIdInTeam(teamId, eventId);
    if (!event) {
      throw new EventNotFoundException();
    }
    return this.attendances.findByEvent(eventId);
  }
}
