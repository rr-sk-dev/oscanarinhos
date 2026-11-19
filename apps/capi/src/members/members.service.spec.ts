import { PlayerRepository } from '../players/players.repository';
import { TeamStaffRepository } from '../teams/staff/team-staff.repository';
import { MembershipRepository } from './membership.repository';
import { InviteRepository } from './invite.repository';
import { MembersService } from './members.service';
import { InviteEntity } from './types/invite.entity';
import { MembershipEntity } from './types/membership.entity';
import {
  InviteInvalidException,
  LastAdminException,
  MembershipAlreadyExistsException,
  MembershipNotFoundException,
} from './exceptions/members.exceptions';

describe('MembersService', () => {
  let service: MembersService;
  let membershipRepository: jest.Mocked<MembershipRepository>;
  let inviteRepository: jest.Mocked<InviteRepository>;
  let playerRepository: jest.Mocked<PlayerRepository>;
  let teamStaffRepository: jest.Mocked<TeamStaffRepository>;

  const adminMembership: MembershipEntity = {
    id: 'admin-membership',
    userId: 'admin-user',
    teamId: 'team-1',
    role: 'ADMIN',
    playerId: null,
    staffId: null,
    displayName: 'Admin',
  };

  const validInvite: InviteEntity = {
    id: 'invite-1',
    teamId: 'team-1',
    role: 'PLAYER',
    code: 'ABCDEFGHJK',
    playerId: 'player-1',
    staffId: null,
    maxUses: 1,
    uses: 0,
    expiresAt: new Date(Date.now() + 60_000),
    createdByMembershipId: 'admin-membership',
    createdAt: new Date(),
  };

  const createdMembership: MembershipEntity = {
    id: 'new-membership',
    userId: 'user-2',
    teamId: 'team-1',
    role: 'PLAYER',
    playerId: 'player-1',
    staffId: null,
    displayName: 'Jogador',
  };

  beforeEach(() => {
    membershipRepository = {
      findByUserAndTeam: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      findByPlayerId: jest.fn().mockResolvedValue(null),
      findByStaffId: jest.fn().mockResolvedValue(null),
      findByUserWithTeam: jest.fn(),
      findByTeam: jest.fn(),
      countAdmins: jest.fn(),
      create: jest.fn().mockResolvedValue(createdMembership),
      update: jest.fn(),
      delete: jest.fn(),
    } as jest.Mocked<MembershipRepository>;
    inviteRepository = {
      findByCode: jest.fn().mockResolvedValue(validInvite),
      create: jest.fn(),
      consume: jest.fn().mockResolvedValue(true),
      release: jest.fn(),
    } as jest.Mocked<InviteRepository>;
    playerRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'player-1', teamId: 'team-1' }),
    } as unknown as jest.Mocked<PlayerRepository>;
    teamStaffRepository = {
      findById: jest.fn().mockResolvedValue({ id: 'staff-1', teamId: 'team-1' }),
    } as unknown as jest.Mocked<TeamStaffRepository>;
    service = new MembersService(
      membershipRepository,
      inviteRepository,
      playerRepository,
      teamStaffRepository,
    );
  });

  describe('createInvite', () => {
    it('creates a single-use invite with a 10 character code that expires in 7 days', async () => {
      inviteRepository.create.mockImplementation((data) =>
        Promise.resolve({ ...validInvite, ...data }),
      );
      const before = Date.now();

      const invite = await service.createInvite('team-1', adminMembership, {
        role: 'PLAYER',
        playerId: 'player-1',
      });

      const data = inviteRepository.create.mock.calls[0][0];
      expect(data.code).toMatch(/^[A-HJ-NP-Z2-9]{10}$/);
      expect(data.maxUses).toBe(1);
      expect(data.teamId).toBe('team-1');
      expect(data.createdByMembershipId).toBe('admin-membership');
      expect(data.playerId).toBe('player-1');
      expect(data.staffId).toBeNull();
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      expect(data.expiresAt.getTime() - before).toBeGreaterThanOrEqual(sevenDays);
      expect(data.expiresAt.getTime() - before).toBeLessThan(sevenDays + 5_000);
      expect(invite.code).toBe(data.code);
    });

    it('rejects a player of another team', async () => {
      playerRepository.findById.mockResolvedValue({ id: 'player-1', teamId: 'team-2' } as never);
      await expect(
        service.createInvite('team-1', adminMembership, { role: 'PLAYER', playerId: 'player-1' }),
      ).rejects.toMatchObject({ code: 'INVITE_INVALID' });
      expect(inviteRepository.create).not.toHaveBeenCalled();
    });

    it('rejects an unknown player', async () => {
      playerRepository.findById.mockResolvedValue(null);
      await expect(
        service.createInvite('team-1', adminMembership, { role: 'PLAYER', playerId: 'player-1' }),
      ).rejects.toBeInstanceOf(InviteInvalidException);
    });

    it('rejects a staff member of another team', async () => {
      teamStaffRepository.findById.mockResolvedValue({ id: 'staff-1', teamId: 'team-2' } as never);
      await expect(
        service.createInvite('team-1', adminMembership, { role: 'STAFF', staffId: 'staff-1' }),
      ).rejects.toMatchObject({ code: 'INVITE_INVALID' });
      expect(inviteRepository.create).not.toHaveBeenCalled();
    });

    it('generates different codes', async () => {
      inviteRepository.create.mockImplementation((data) =>
        Promise.resolve({ ...validInvite, ...data }),
      );
      await service.createInvite('team-1', adminMembership, { role: 'COACH' });
      await service.createInvite('team-1', adminMembership, { role: 'COACH' });
      const [first, second] = inviteRepository.create.mock.calls.map(([data]) => data.code);
      expect(first).not.toBe(second);
    });
  });

  describe('acceptInvite', () => {
    it('creates a membership with the invite role and linked player', async () => {
      const result = await service.acceptInvite('user-2', 'ABCDEFGHJK');

      expect(membershipRepository.create).toHaveBeenCalledWith({
        userId: 'user-2',
        teamId: 'team-1',
        role: 'PLAYER',
        playerId: 'player-1',
        staffId: null,
      });
      expect(inviteRepository.consume).toHaveBeenCalledWith('invite-1', expect.any(Date));
      expect(result).toEqual(createdMembership);
    });

    it('links the staff member of the invite', async () => {
      inviteRepository.findByCode.mockResolvedValue({
        ...validInvite,
        role: 'STAFF',
        playerId: null,
        staffId: 'staff-1',
      });

      await service.acceptInvite('user-2', 'ABCDEFGHJK');

      expect(membershipRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ role: 'STAFF', playerId: null, staffId: 'staff-1' }),
      );
    });

    it('rejects an unknown code', async () => {
      inviteRepository.findByCode.mockResolvedValue(null);
      await expect(service.acceptInvite('user-2', 'NOPE')).rejects.toMatchObject({
        code: 'INVITE_INVALID',
      });
      expect(membershipRepository.create).not.toHaveBeenCalled();
    });

    it('rejects an expired invite', async () => {
      inviteRepository.findByCode.mockResolvedValue({
        ...validInvite,
        expiresAt: new Date(Date.now() - 1000),
      });
      await expect(service.acceptInvite('user-2', 'ABCDEFGHJK')).rejects.toBeInstanceOf(
        InviteInvalidException,
      );
      expect(membershipRepository.create).not.toHaveBeenCalled();
    });

    it('rejects an invite that is used up', async () => {
      inviteRepository.findByCode.mockResolvedValue({ ...validInvite, uses: 1 });
      await expect(service.acceptInvite('user-2', 'ABCDEFGHJK')).rejects.toBeInstanceOf(
        InviteInvalidException,
      );
      expect(membershipRepository.create).not.toHaveBeenCalled();
    });

    it('rejects when the atomic consume loses the race', async () => {
      inviteRepository.consume.mockResolvedValue(false);
      await expect(service.acceptInvite('user-2', 'ABCDEFGHJK')).rejects.toBeInstanceOf(
        InviteInvalidException,
      );
      expect(membershipRepository.create).not.toHaveBeenCalled();
    });

    it('rejects a user who is already in the team and does not consume the invite', async () => {
      membershipRepository.findByUserAndTeam.mockResolvedValue(createdMembership);
      await expect(service.acceptInvite('user-2', 'ABCDEFGHJK')).rejects.toBeInstanceOf(
        MembershipAlreadyExistsException,
      );
      expect(inviteRepository.consume).not.toHaveBeenCalled();
    });

    it('does not link a player of another team even if the invite already exists', async () => {
      playerRepository.findById.mockResolvedValue({ id: 'player-1', teamId: 'team-2' } as never);
      await expect(service.acceptInvite('user-2', 'ABCDEFGHJK')).rejects.toBeInstanceOf(
        InviteInvalidException,
      );
      expect(inviteRepository.consume).not.toHaveBeenCalled();
      expect(membershipRepository.create).not.toHaveBeenCalled();
    });

    it('does not link a staff member of another team even if the invite already exists', async () => {
      inviteRepository.findByCode.mockResolvedValue({
        ...validInvite,
        role: 'STAFF',
        playerId: null,
        staffId: 'staff-1',
      });
      teamStaffRepository.findById.mockResolvedValue({ id: 'staff-1', teamId: 'team-2' } as never);
      await expect(service.acceptInvite('user-2', 'ABCDEFGHJK')).rejects.toBeInstanceOf(
        InviteInvalidException,
      );
      expect(inviteRepository.consume).not.toHaveBeenCalled();
    });

    it('rejects a player already linked to another membership', async () => {
      membershipRepository.findByPlayerId.mockResolvedValue({
        ...createdMembership,
        userId: 'someone-else',
      });
      await expect(service.acceptInvite('user-2', 'ABCDEFGHJK')).rejects.toMatchObject({
        code: 'MEMBERSHIP_ALREADY_EXISTS',
      });
      expect(inviteRepository.consume).not.toHaveBeenCalled();
    });

    it('rejects a staff member already linked to another membership', async () => {
      inviteRepository.findByCode.mockResolvedValue({
        ...validInvite,
        role: 'STAFF',
        playerId: null,
        staffId: 'staff-1',
      });
      membershipRepository.findByStaffId.mockResolvedValue(createdMembership);
      await expect(service.acceptInvite('user-2', 'ABCDEFGHJK')).rejects.toBeInstanceOf(
        MembershipAlreadyExistsException,
      );
      expect(inviteRepository.consume).not.toHaveBeenCalled();
    });

    it('gives the use back when creating the membership fails', async () => {
      membershipRepository.create.mockRejectedValue(new MembershipAlreadyExistsException());
      await expect(service.acceptInvite('user-2', 'ABCDEFGHJK')).rejects.toBeInstanceOf(
        MembershipAlreadyExistsException,
      );
      expect(inviteRepository.release).toHaveBeenCalledWith('invite-1');
    });

    it('lets the same user join two different teams', async () => {
      await service.acceptInvite('user-2', 'ABCDEFGHJK');
      inviteRepository.findByCode.mockResolvedValue({
        ...validInvite,
        id: 'invite-2',
        teamId: 'team-2',
        playerId: null,
        role: 'COACH',
      });
      await service.acceptInvite('user-2', 'OTHERCODE2');

      expect(membershipRepository.findByUserAndTeam).toHaveBeenCalledWith('user-2', 'team-1');
      expect(membershipRepository.findByUserAndTeam).toHaveBeenCalledWith('user-2', 'team-2');
      expect(membershipRepository.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('remove', () => {
    it('deletes a membership of the team', async () => {
      membershipRepository.findById.mockResolvedValue(createdMembership);
      await service.remove('team-1', 'new-membership');
      expect(membershipRepository.delete).toHaveBeenCalledWith('new-membership');
    });

    it('throws not found for an unknown membership', async () => {
      membershipRepository.findById.mockResolvedValue(null);
      await expect(service.remove('team-1', 'nope')).rejects.toBeInstanceOf(
        MembershipNotFoundException,
      );
    });

    it('throws not found for a membership of another team', async () => {
      membershipRepository.findById.mockResolvedValue({ ...createdMembership, teamId: 'team-2' });
      await expect(service.remove('team-1', 'new-membership')).rejects.toBeInstanceOf(
        MembershipNotFoundException,
      );
      expect(membershipRepository.delete).not.toHaveBeenCalled();
    });

    it('refuses to remove the only remaining admin', async () => {
      membershipRepository.findById.mockResolvedValue(adminMembership);
      membershipRepository.countAdmins.mockResolvedValue(1);
      await expect(service.remove('team-1', 'admin-membership')).rejects.toBeInstanceOf(
        LastAdminException,
      );
      expect(membershipRepository.delete).not.toHaveBeenCalled();
    });

    it('removes an admin when another admin remains', async () => {
      membershipRepository.findById.mockResolvedValue(adminMembership);
      membershipRepository.countAdmins.mockResolvedValue(2);
      await service.remove('team-1', 'admin-membership');
      expect(membershipRepository.delete).toHaveBeenCalledWith('admin-membership');
    });
  });

  describe('changeRole', () => {
    it('refuses to demote the only remaining admin', async () => {
      membershipRepository.findById.mockResolvedValue(adminMembership);
      membershipRepository.countAdmins.mockResolvedValue(1);
      await expect(
        service.changeRole('team-1', 'admin-membership', 'COACH'),
      ).rejects.toBeInstanceOf(LastAdminException);
      expect(membershipRepository.update).not.toHaveBeenCalled();
    });

    it('demotes an admin when another admin remains', async () => {
      membershipRepository.findById.mockResolvedValue(adminMembership);
      membershipRepository.countAdmins.mockResolvedValue(2);
      membershipRepository.update.mockResolvedValue({ ...adminMembership, role: 'COACH' });
      const result = await service.changeRole('team-1', 'admin-membership', 'COACH');
      expect(membershipRepository.update).toHaveBeenCalledWith('admin-membership', {
        role: 'COACH',
      });
      expect(result.role).toBe('COACH');
    });
  });

  describe('listMembers', () => {
    it('returns the members of the team', async () => {
      membershipRepository.findByTeam.mockResolvedValue([adminMembership]);
      await expect(service.listMembers('team-1')).resolves.toEqual([adminMembership]);
    });
  });
});
