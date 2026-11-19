import {
  Membership as PrismaMembership,
  Player as PrismaPlayer,
  TeamStaff as PrismaTeamStaff,
  User as PrismaUser,
} from '../../../prisma/generated/prisma/client';
import { MembershipEntity, MembershipRole } from './membership.entity';

export type PrismaMembershipWithRelations = PrismaMembership & {
  user: PrismaUser;
  player: PrismaPlayer | null;
  staff: PrismaTeamStaff | null;
};

export const MEMBERSHIP_INCLUDE = { user: true, player: true, staff: true } as const;

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
