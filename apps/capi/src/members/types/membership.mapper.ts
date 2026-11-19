import {
  Membership as PrismaMembership,
  Player as PrismaPlayer,
  Team as PrismaTeam,
  TeamStaff as PrismaTeamStaff,
  User as PrismaUser,
} from '../../../prisma/generated/prisma/client';
import { MemberResponseDto } from './membership.dto';
import { MembershipEntity, MembershipRole, MembershipWithTeam } from './membership.entity';

export type PrismaMembershipWithRelations = PrismaMembership & {
  user: PrismaUser;
  player: PrismaPlayer | null;
  staff: PrismaTeamStaff | null;
};

export type PrismaMembershipWithTeam = PrismaMembershipWithRelations & { team: PrismaTeam };

export const MEMBERSHIP_INCLUDE = { user: true, player: true, staff: true } as const;

export const MEMBERSHIP_WITH_TEAM_INCLUDE = { ...MEMBERSHIP_INCLUDE, team: true } as const;

export class MembershipMapper {
  static toDomain(record: PrismaMembershipWithRelations): MembershipEntity {
    return {
      id: record.id,
      userId: record.userId,
      teamId: record.teamId,
      role: record.role as MembershipRole,
      playerId: record.playerId,
      staffId: record.staffId,
      displayName: MembershipMapper.resolveDisplayName(record),
    };
  }

  static toDomainWithTeam(record: PrismaMembershipWithTeam): MembershipWithTeam {
    return { ...MembershipMapper.toDomain(record), teamName: record.team.name };
  }

  static toResponse(membership: MembershipEntity): MemberResponseDto {
    return {
      id: membership.id,
      userId: membership.userId,
      role: membership.role,
      playerId: membership.playerId,
      staffId: membership.staffId,
      displayName: membership.displayName,
    };
  }

  private static resolveDisplayName(record: PrismaMembershipWithRelations): string {
    if (record.player) {
      return record.player.fullName;
    }

    if (record.staff) {
      return `${record.staff.firstName} ${record.staff.lastName}`.trim();
    }

    return record.user.name ?? record.user.email.split('@')[0];
  }
}
