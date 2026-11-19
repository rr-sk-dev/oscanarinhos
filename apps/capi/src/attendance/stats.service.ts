import { Injectable } from '@nestjs/common';
import { Clock } from '../availability/clock';
import { MembershipRepository } from '../members/membership.repository';
import { CURRENT_SEASON_KICKOFFS } from '../scrapper/cif.constants';
import { AttendanceRepository } from './attendance.repository';
import { StatsRangeInvalidException } from './exceptions/attendance.exceptions';
import { AttendanceRecord, MemberStats, TeamStats, TypeStats } from './types/attendance.entity';

/** Defaults to the current season window; from must be before to. */
export function resolveStatsRange(from?: Date, to?: Date): { from: Date; to: Date } {
  const range = {
    from: from ?? CURRENT_SEASON_KICKOFFS.kickoffFrom,
    to: to ?? CURRENT_SEASON_KICKOFFS.kickoffTo,
  };
  if (range.from >= range.to) {
    throw new StatsRangeInvalidException();
  }
  return range;
}

@Injectable()
export class StatsService {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly attendances: AttendanceRepository,
    private readonly clock: Clock,
  ) {}

  async get(teamId: string, from: Date, to: Date): Promise<TeamStats> {
    const now = this.clock.now();
    const [members, rows] = await Promise.all([
      this.memberships.findByTeam(teamId),
      this.attendances.findByTeamBetween(teamId, from, to),
    ]);
    const counted = rows.filter((row) => row.eventStatus !== 'CANCELED' && row.eventStartsAt < now);

    return {
      members: members.map((member) => this.memberStats(member, counted)),
      byType: this.typeStats(counted),
    };
  }

  private memberStats(
    member: { id: string; displayName: string; role: MemberStats['role'] },
    rows: AttendanceRecord[],
  ): MemberStats {
    const own = rows.filter((row) => row.membershipId === member.id);
    const attended = own.filter((row) => row.attended).length;
    return {
      membershipId: member.id,
      displayName: member.displayName,
      role: member.role,
      markedEvents: own.length,
      attended,
      attendancePercent: own.length === 0 ? 0 : Math.round((attended / own.length) * 100),
    };
  }

  private typeStats(rows: AttendanceRecord[]): TypeStats[] {
    const groups = new Map<TypeStats['type'], { eventIds: Set<string>; attended: number }>();
    for (const row of rows) {
      const group = groups.get(row.eventType) ?? { eventIds: new Set<string>(), attended: 0 };
      group.eventIds.add(row.eventId);
      group.attended += row.attended ? 1 : 0;
      groups.set(row.eventType, group);
    }
    return [...groups.entries()].map(([type, group]) => ({
      type,
      events: group.eventIds.size,
      averageAttended: Math.round((group.attended / group.eventIds.size) * 10) / 10,
    }));
  }
}
