import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { TeamMemberGuard } from './team-member.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { NotATeamMemberException, RoleForbiddenException } from '../exceptions/auth.exceptions';
import { MembershipRepository } from '../../members/membership.repository';
import { MembershipEntity } from '../../members/types/membership.entity';

const TEAM_A = '11111111-1111-4111-8111-111111111111';
const TEAM_B = '22222222-2222-4222-8222-222222222222';

const membership = (overrides: Partial<MembershipEntity> = {}): MembershipEntity => ({
  id: 'membership-uuid',
  userId: 'user-uuid',
  teamId: TEAM_A,
  role: 'PLAYER',
  playerId: null,
  staffId: null,
  displayName: 'Someone',
  ...overrides,
});

const contextFor = (
  request: Record<string, unknown>,
  handler: object = () => undefined,
): ExecutionContext =>
  ({
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => handler,
    getClass: () => class {},
  }) as unknown as ExecutionContext;

describe('TeamMemberGuard', () => {
  let membershipRepository: jest.Mocked<MembershipRepository>;
  let guard: TeamMemberGuard;

  beforeEach(() => {
    membershipRepository = {
      findByUserAndTeam: jest.fn(),
    } as unknown as jest.Mocked<MembershipRepository>;
    guard = new TeamMemberGuard(membershipRepository);
  });

  it('rejects a user with no membership in the team (TEAM_FORBIDDEN)', async () => {
    membershipRepository.findByUserAndTeam.mockResolvedValue(null);
    const request = { user: { userId: 'user-uuid' }, params: { teamId: TEAM_A } };

    const attempt = guard.canActivate(contextFor(request));

    await expect(attempt).rejects.toThrow(NotATeamMemberException);
    await expect(attempt).rejects.toMatchObject({ code: 'TEAM_FORBIDDEN' });
  });

  it('rejects a member of team A who names team B in the route', async () => {
    membershipRepository.findByUserAndTeam.mockImplementation((_userId, teamId) =>
      Promise.resolve(teamId === TEAM_A ? membership() : null),
    );
    const request = { user: { userId: 'user-uuid' }, params: { teamId: TEAM_B } };

    await expect(guard.canActivate(contextFor(request))).rejects.toMatchObject({
      code: 'TEAM_FORBIDDEN',
    });
    expect(membershipRepository.findByUserAndTeam).toHaveBeenCalledWith('user-uuid', TEAM_B);
  });

  it('rejects a malformed team id without hitting the repository', async () => {
    const request = { user: { userId: 'user-uuid' }, params: { teamId: 'not-a-uuid' } };

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(NotATeamMemberException);
    expect(membershipRepository.findByUserAndTeam).not.toHaveBeenCalled();
  });

  it('rejects a request that has no authenticated user', async () => {
    const request = { params: { teamId: TEAM_A } };

    await expect(guard.canActivate(contextFor(request))).rejects.toThrow(NotATeamMemberException);
  });

  it('attaches the membership to the request for a member', async () => {
    const found = membership();
    membershipRepository.findByUserAndTeam.mockResolvedValue(found);
    const request: Record<string, unknown> = {
      user: { userId: 'user-uuid' },
      params: { teamId: TEAM_A },
    };

    await expect(guard.canActivate(contextFor(request))).resolves.toBe(true);
    expect(request.membership).toBe(found);
  });
});

describe('RolesGuard', () => {
  const guard = new RolesGuard(new Reflector());

  class Controller {
    @Roles('ADMIN', 'COACH')
    restricted() {
      return undefined;
    }

    open() {
      return undefined;
    }
  }

  const restricted = Controller.prototype.restricted;
  const open = Controller.prototype.open;

  it.each(['ADMIN', 'COACH'] as const)('allows %s on a @Roles(ADMIN, COACH) route', (role) => {
    const request = { membership: membership({ role }) };

    expect(guard.canActivate(contextFor(request, restricted))).toBe(true);
  });

  it('rejects PLAYER on a @Roles(ADMIN, COACH) route (ROLE_FORBIDDEN)', () => {
    const request = { membership: membership({ role: 'PLAYER' }) };

    expect(() => guard.canActivate(contextFor(request, restricted))).toThrow(
      RoleForbiddenException,
    );
    try {
      guard.canActivate(contextFor(request, restricted));
    } catch (error) {
      expect(error).toMatchObject({ code: 'ROLE_FORBIDDEN' });
    }
  });

  it('rejects when no membership was resolved', () => {
    expect(() => guard.canActivate(contextFor({}, restricted))).toThrow(RoleForbiddenException);
  });

  it('allows any member on a route without @Roles', () => {
    const request = { membership: membership({ role: 'STAFF' }) };

    expect(guard.canActivate(contextFor(request, open))).toBe(true);
  });
});
