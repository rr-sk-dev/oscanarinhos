import { IsISO8601, IsOptional } from 'class-validator';
import { EventType } from '../../events/types/event.entity';
import { MembershipRole } from '../../members/types/membership.entity';

export class StatsQueryDto {
  @IsOptional()
  @IsISO8601({ strict: true })
  from?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  to?: string;
}

export class MemberStatsDto {
  membershipId: string;
  displayName: string;
  role: MembershipRole;
  markedEvents: number;
  attended: number;
  attendancePercent: number;
}

export class TypeStatsDto {
  type: EventType;
  events: number;
  averageAttended: number;
}

export class TeamStatsDto {
  members: MemberStatsDto[];
  byType: TypeStatsDto[];
}
