import { MembershipRepository } from '../members/membership.repository';
import { TeamRepository } from '../teams/teams.repository';
import { UserRepository } from '../users/user.repository';
import { CreateAdminService } from './create-admin.service';

describe('CreateAdminService', () => {
  let userRepository: jest.Mocked<UserRepository>;
  let membershipRepository: jest.Mocked<MembershipRepository>;
  let teamRepository: jest.Mocked<TeamRepository>;
  let service: CreateAdminService;

  const user = {
    id: 'u1',
    email: 'ana@x.pt',
    name: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const team = { id: 't1', name: 'Os Canarinhos' };
  const membership = {
    id: 'm1',
    userId: 'u1',
    teamId: 't1',
    role: 'PLAYER' as const,
    playerId: null,
    staffId: null,
    displayName: 'ana',
  };

  beforeEach(() => {
    userRepository = {
      findByEmail: jest.fn().mockResolvedValue(user),
      create: jest.fn().mockResolvedValue(user),
    } as unknown as jest.Mocked<UserRepository>;
    membershipRepository = {
      findByUserAndTeam: jest.fn().mockResolvedValue(null),
      create: jest.fn().mockResolvedValue({ ...membership, role: 'ADMIN' }),
      update: jest.fn().mockResolvedValue({ ...membership, role: 'ADMIN' }),
    } as unknown as jest.Mocked<MembershipRepository>;
    teamRepository = {
      findAll: jest.fn().mockResolvedValue([team, { id: 't2', name: 'Rivais FC' }]),
    } as unknown as jest.Mocked<TeamRepository>;
    service = new CreateAdminService(userRepository, membershipRepository, teamRepository);
  });

  it('matches the team by slug and creates an ADMIN membership', async () => {
    const result = await service.execute('Ana@X.pt', 'os-canarinhos');
    expect(membershipRepository.create).toHaveBeenCalledWith({
      userId: 'u1',
      teamId: 't1',
      role: 'ADMIN',
    });
    expect(result.role).toBe('ADMIN');
    expect(userRepository.findByEmail).toHaveBeenCalledWith('ana@x.pt');
  });

  it('creates the user when it does not exist', async () => {
    userRepository.findByEmail.mockResolvedValue(null);
    await service.execute('ana@x.pt', 'os-canarinhos');
    expect(userRepository.create).toHaveBeenCalledWith({ email: 'ana@x.pt' });
  });

  it('promotes an existing membership to ADMIN', async () => {
    membershipRepository.findByUserAndTeam.mockResolvedValue(membership);
    await service.execute('ana@x.pt', 'os-canarinhos');
    expect(membershipRepository.update).toHaveBeenCalledWith('m1', { role: 'ADMIN' });
    expect(membershipRepository.create).not.toHaveBeenCalled();
  });

  it('refuses an unknown team slug and creates nothing', async () => {
    await expect(service.execute('ana@x.pt', 'nope')).rejects.toThrow(/Unknown team slug/);
    expect(userRepository.create).not.toHaveBeenCalled();
    expect(membershipRepository.create).not.toHaveBeenCalled();
  });
});
