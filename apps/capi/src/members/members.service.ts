import { Injectable } from '@nestjs/common';
import {
  InviteInvalidException,
  LastAdminException,
  MembershipAlreadyExistsException,
  MembershipNotFoundException,
} from './exceptions/members.exceptions';
import { generateInviteCode } from './invite-code';
import { InviteRepository } from './invite.repository';
import { MembershipRepository } from './membership.repository';
import { CreateInviteInput, InviteEntity } from './types/invite.entity';
import { MembershipEntity, MembershipRole } from './types/membership.entity';

const INVITE_VALIDITY_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class MembersService {
  constructor(
    private readonly membershipRepository: MembershipRepository,
    private readonly inviteRepository: InviteRepository,
  ) {}

  listMembers(teamId: string): Promise<MembershipEntity[]> {
    return this.membershipRepository.findByTeam(teamId);
  }

  createInvite(
    teamId: string,
    creator: MembershipEntity,
    input: CreateInviteInput,
  ): Promise<InviteEntity> {
    return this.inviteRepository.create({
      teamId,
      role: input.role,
      code: generateInviteCode(),
      playerId: input.playerId ?? null,
      staffId: input.staffId ?? null,
      maxUses: 1,
      expiresAt: new Date(Date.now() + INVITE_VALIDITY_MS),
      createdByMembershipId: creator.id,
    });
  }

  async acceptInvite(userId: string, code: string): Promise<MembershipEntity> {
    const now = new Date();
    const invite = await this.inviteRepository.findByCode(code);
    if (!invite || invite.uses >= invite.maxUses || invite.expiresAt <= now) {
      throw new InviteInvalidException();
    }

    await this.assertCanJoin(userId, invite);

    const wasConsumed = await this.inviteRepository.consume(invite.id, now);
    if (!wasConsumed) {
      throw new InviteInvalidException();
    }

    try {
      return await this.membershipRepository.create({
        userId,
        teamId: invite.teamId,
        role: invite.role,
        playerId: invite.playerId,
        staffId: invite.staffId,
      });
    } catch (error) {
      await this.inviteRepository.release(invite.id);
      throw error;
    }
  }

  async remove(teamId: string, membershipId: string): Promise<void> {
    const membership = await this.findInTeam(teamId, membershipId);
    await this.assertNotLastAdmin(membership);
    await this.membershipRepository.delete(membership.id);
  }

  async changeRole(
    teamId: string,
    membershipId: string,
    role: MembershipRole,
  ): Promise<MembershipEntity> {
    const membership = await this.findInTeam(teamId, membershipId);
    if (role !== 'ADMIN') {
      await this.assertNotLastAdmin(membership);
    }
    return this.membershipRepository.update(membership.id, { role });
  }

  private async findInTeam(teamId: string, membershipId: string): Promise<MembershipEntity> {
    const membership = await this.membershipRepository.findById(membershipId);
    if (!membership || membership.teamId !== teamId) {
      throw new MembershipNotFoundException();
    }
    return membership;
  }

  private async assertNotLastAdmin(membership: MembershipEntity): Promise<void> {
    if (membership.role !== 'ADMIN') {
      return;
    }
    const adminCount = await this.membershipRepository.countAdmins(membership.teamId);
    if (adminCount <= 1) {
      throw new LastAdminException();
    }
  }

  private async assertCanJoin(userId: string, invite: InviteEntity): Promise<void> {
    const existing = await this.membershipRepository.findByUserAndTeam(userId, invite.teamId);
    if (existing) {
      throw new MembershipAlreadyExistsException();
    }

    if (invite.playerId && (await this.membershipRepository.findByPlayerId(invite.playerId))) {
      throw new MembershipAlreadyExistsException();
    }

    if (invite.staffId && (await this.membershipRepository.findByStaffId(invite.staffId))) {
      throw new MembershipAlreadyExistsException();
    }
  }
}
