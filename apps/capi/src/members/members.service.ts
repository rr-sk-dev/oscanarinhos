import { Injectable } from '@nestjs/common';
import {
  InviteInvalidException,
  LastAdminException,
  MembershipAlreadyExistsException,
  MembershipNotFoundException,
} from './exceptions/members.exceptions';
import { PlayerRepository } from '../players/players.repository';
import { TeamStaffRepository } from '../teams/staff/team-staff.repository';
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
    private readonly playerRepository: PlayerRepository,
    private readonly teamStaffRepository: TeamStaffRepository,
  ) {}

  listMembers(teamId: string): Promise<MembershipEntity[]> {
    return this.membershipRepository.findByTeam(teamId);
  }

  async createInvite(
    teamId: string,
    creator: MembershipEntity,
    input: CreateInviteInput,
  ): Promise<InviteEntity> {
    await this.assertLinksBelongToTeam(teamId, input.playerId, input.staffId);
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

    await this.assertLinksBelongToTeam(invite.teamId, invite.playerId, invite.staffId);
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

  /** Same error for "missing" and "other team" so nothing leaks about other teams' records. */
  private async assertLinksBelongToTeam(
    teamId: string,
    playerId?: string | null,
    staffId?: string | null,
  ): Promise<void> {
    if (playerId) {
      const player = await this.playerRepository.findById(playerId);
      if (!player || player.teamId !== teamId) {
        throw new InviteInvalidException();
      }
    }

    if (staffId) {
      const staff = await this.teamStaffRepository.findById(staffId);
      if (!staff || staff.teamId !== teamId) {
        throw new InviteInvalidException();
      }
    }
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
