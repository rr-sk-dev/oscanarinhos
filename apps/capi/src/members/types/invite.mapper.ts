import { Invite as PrismaInvite } from '../../../prisma/generated/prisma/client';
import { InviteEntity } from './invite.entity';
import { InviteResponseDto } from './membership.dto';
import { MembershipRole } from './membership.entity';

export class InviteMapper {
  static toDomain(record: PrismaInvite): InviteEntity {
    return {
      id: record.id,
      teamId: record.teamId,
      role: record.role as MembershipRole,
      code: record.code,
      playerId: record.playerId,
      staffId: record.staffId,
      maxUses: record.maxUses,
      uses: record.uses,
      expiresAt: record.expiresAt,
      createdByMembershipId: record.createdByMembershipId,
      createdAt: record.createdAt,
    };
  }

  static toResponse(invite: InviteEntity): InviteResponseDto {
    return {
      id: invite.id,
      code: invite.code,
      role: invite.role,
      playerId: invite.playerId,
      staffId: invite.staffId,
      maxUses: invite.maxUses,
      expiresAt: invite.expiresAt.toISOString(),
    };
  }
}
