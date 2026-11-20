import { AvailabilityRepository } from '../availability/availability.repository';
import { AvailabilityAnswer, AvailabilityEntity } from '../availability/types/availability.entity';
import { MembershipRepository } from '../members/membership.repository';
import { MembershipEntity } from '../members/types/membership.entity';
import { UserRepository } from '../users/user.repository';
import { UserEntity } from '../users/types/user.entity';
import { RecipientResolver } from './recipient-resolver.service';

const membership = (id: string, userId: string, teamId = 'team-1'): MembershipEntity => ({
  id,
  userId,
  teamId,
  role: 'PLAYER',
  playerId: null,
  staffId: null,
  displayName: id,
});

const answer = (membershipId: string, value: AvailabilityAnswer): AvailabilityEntity => ({
  id: `a-${membershipId}`,
  eventId: 'event-1',
  membershipId,
  answer: value,
  note: null,
});

const user = (id: string): UserEntity => ({
  id,
  email: `${id}@example.com`,
  name: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('RecipientResolver', () => {
  let memberships: jest.Mocked<Pick<MembershipRepository, 'findByTeam'>>;
  let availability: jest.Mocked<Pick<AvailabilityRepository, 'findByEvent'>>;
  let users: jest.Mocked<Pick<UserRepository, 'findById'>>;
  let resolver: RecipientResolver;

  const setup = (
    teamMemberships: MembershipEntity[],
    answers: AvailabilityEntity[] = [],
    knownUsers: string[] = teamMemberships.map((m) => m.userId),
  ): void => {
    memberships.findByTeam.mockResolvedValue(teamMemberships);
    availability.findByEvent.mockResolvedValue(answers);
    users.findById.mockImplementation((id) =>
      Promise.resolve(knownUsers.includes(id) ? user(id) : null),
    );
  };

  beforeEach(() => {
    memberships = { findByTeam: jest.fn() };
    availability = { findByEvent: jest.fn() };
    users = { findById: jest.fn() };
    resolver = new RecipientResolver(
      memberships as unknown as MembershipRepository,
      availability as unknown as AvailabilityRepository,
      users as unknown as UserRepository,
    );
  });

  it('includes members who answered YES, MAYBE or did not answer', async () => {
    setup(
      [membership('m1', 'u1'), membership('m2', 'u2'), membership('m3', 'u3')],
      [answer('m1', 'YES'), answer('m2', 'MAYBE')],
    );

    const result = await resolver.resolve('team-1', 'event-1', null);

    expect(result).toEqual([
      { userId: 'u1', email: 'u1@example.com' },
      { userId: 'u2', email: 'u2@example.com' },
      { userId: 'u3', email: 'u3@example.com' },
    ]);
  });

  it('excludes members who answered NO', async () => {
    setup([membership('m1', 'u1'), membership('m2', 'u2')], [answer('m1', 'NO')]);

    const result = await resolver.resolve('team-1', 'event-1', null);

    expect(result).toEqual([{ userId: 'u2', email: 'u2@example.com' }]);
  });

  it('excludes the actor', async () => {
    setup([membership('m1', 'u1'), membership('m2', 'u2')]);

    const result = await resolver.resolve('team-1', 'event-1', 'u1');

    expect(result).toEqual([{ userId: 'u2', email: 'u2@example.com' }]);
  });

  it('excludes nobody when the actor is null', async () => {
    setup([membership('m1', 'u1'), membership('m2', 'u2')]);

    const result = await resolver.resolve('team-1', 'event-1', null);

    expect(result.map((recipient) => recipient.userId)).toEqual(['u1', 'u2']);
  });

  it('lists a user with two memberships in the team once', async () => {
    setup([membership('m1', 'u1'), membership('m2', 'u1')]);

    const result = await resolver.resolve('team-1', 'event-1', null);

    expect(result).toEqual([{ userId: 'u1', email: 'u1@example.com' }]);
  });

  it('uses only the memberships of the given team', async () => {
    setup([membership('m1', 'u1')], [], ['u1', 'other-team-user']);

    const result = await resolver.resolve('team-1', 'event-1', null);

    expect(memberships.findByTeam).toHaveBeenCalledWith('team-1');
    expect(result.map((recipient) => recipient.userId)).toEqual(['u1']);
  });

  it('skips a user id that no longer exists', async () => {
    setup([membership('m1', 'u1'), membership('m2', 'ghost')], [], ['u1']);

    const result = await resolver.resolve('team-1', 'event-1', null);

    expect(result).toEqual([{ userId: 'u1', email: 'u1@example.com' }]);
  });
});
