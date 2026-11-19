import { MembershipRepository } from '../members/membership.repository';
import { UserRepository } from '../users/user.repository';
import { MeService } from './me.service';

describe('MeService', () => {
  let membershipRepository: jest.Mocked<MembershipRepository>;
  let userRepository: jest.Mocked<UserRepository>;
  let service: MeService;

  beforeEach(() => {
    membershipRepository = {
      findByUserWithTeam: jest.fn(),
    } as unknown as jest.Mocked<MembershipRepository>;
    userRepository = { findById: jest.fn() } as unknown as jest.Mocked<UserRepository>;
    service = new MeService(userRepository, membershipRepository);
  });

  it('lists the user and every membership with the team name', async () => {
    userRepository.findById.mockResolvedValue({
      id: 'u1',
      email: 'a@b.pt',
      name: 'Ana',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    membershipRepository.findByUserWithTeam.mockResolvedValue([
      {
        id: 'm1',
        userId: 'u1',
        teamId: 't1',
        teamName: 'Canarinhos',
        role: 'ADMIN',
        playerId: null,
        staffId: null,
        displayName: 'Ana',
      },
      {
        id: 'm2',
        userId: 'u1',
        teamId: 't2',
        teamName: 'Rivais',
        role: 'PLAYER',
        playerId: 'p',
        staffId: null,
        displayName: 'Ana',
      },
    ]);

    await expect(service.getMe('u1')).resolves.toEqual({
      user: { id: 'u1', email: 'a@b.pt', name: 'Ana' },
      memberships: [
        { teamId: 't1', teamName: 'Canarinhos', role: 'ADMIN', membershipId: 'm1' },
        { teamId: 't2', teamName: 'Rivais', role: 'PLAYER', membershipId: 'm2' },
      ],
    });
  });

  it('throws not found when the user no longer exists', async () => {
    userRepository.findById.mockResolvedValue(null);
    await expect(service.getMe('gone')).rejects.toMatchObject({ code: 'USER_NOT_FOUND' });
  });
});
