import { AvailabilityRepository } from '../availability/availability.repository';
import { AvailabilityEntity } from '../availability/types/availability.entity';
import { MembershipRepository } from '../members/membership.repository';
import { MembershipEntity } from '../members/types/membership.entity';
import { EventAnswersService } from './event-answers.service';
import { EventEntity } from './types/event.entity';

const event = (id: string): EventEntity => ({
  id,
  teamId: 'team-1',
  type: 'TRAINING',
  title: 'Treino',
  startsAt: new Date('2026-12-01T19:00:00Z'),
  endsAt: null,
  location: null,
  notes: null,
  respondBy: null,
  status: 'SCHEDULED',
  matchId: null,
  seriesId: null,
});

const member = (id: string): MembershipEntity => ({
  id,
  userId: `user-${id}`,
  teamId: 'team-1',
  role: 'PLAYER',
  playerId: null,
  staffId: null,
  displayName: id,
});

const answer = (
  eventId: string,
  membershipId: string,
  value: AvailabilityEntity['answer'],
): AvailabilityEntity => ({
  id: `${eventId}-${membershipId}`,
  eventId,
  membershipId,
  answer: value,
  note: null,
});

describe('EventAnswersService', () => {
  let service: EventAnswersService;
  let availabilities: jest.Mocked<AvailabilityRepository>;
  let memberships: jest.Mocked<MembershipRepository>;

  beforeEach(() => {
    availabilities = { findByEvents: jest.fn() } as unknown as jest.Mocked<AvailabilityRepository>;
    memberships = { findByTeam: jest.fn() } as unknown as jest.Mocked<MembershipRepository>;
    service = new EventAnswersService(availabilities, memberships);
  });

  it('counts answers per event and reports the viewer answer, in one query', async () => {
    memberships.findByTeam.mockResolvedValue([member('m-1'), member('m-2'), member('m-3')]);
    availabilities.findByEvents.mockResolvedValue([
      answer('e-1', 'm-1', 'YES'),
      answer('e-1', 'm-2', 'NO'),
      answer('e-2', 'm-1', 'MAYBE'),
    ]);

    const [first, second] = await service.enrich(
      'team-1',
      [event('e-1'), event('e-2')],
      member('m-1'),
    );

    expect(availabilities.findByEvents).toHaveBeenCalledTimes(1);
    expect(availabilities.findByEvents).toHaveBeenCalledWith(['e-1', 'e-2']);
    expect(first.myAnswer).toBe('YES');
    expect(first.counts).toEqual({ yes: 1, maybe: 0, no: 1, noAnswer: 1 });
    expect(second.myAnswer).toBe('MAYBE');
    expect(second.counts).toEqual({ yes: 0, maybe: 1, no: 0, noAnswer: 2 });
  });

  it('returns a null myAnswer when the viewer has not answered', async () => {
    memberships.findByTeam.mockResolvedValue([member('m-1'), member('m-2')]);
    availabilities.findByEvents.mockResolvedValue([answer('e-1', 'm-2', 'YES')]);

    const result = await service.enrichOne('team-1', event('e-1'), member('m-1'));

    expect(result.myAnswer).toBeNull();
  });

  it('ignores answers from people who are not members of the team, so noAnswer is never negative', async () => {
    memberships.findByTeam.mockResolvedValue([member('m-1')]);
    availabilities.findByEvents.mockResolvedValue([
      answer('e-1', 'm-1', 'YES'),
      answer('e-1', 'other-team-member', 'YES'),
      answer('e-1', 'left', 'NO'),
    ]);

    const result = await service.enrichOne('team-1', event('e-1'), member('m-1'));

    expect(result.counts).toEqual({ yes: 1, maybe: 0, no: 0, noAnswer: 0 });
  });

  it('skips the queries when there are no events', async () => {
    await expect(service.enrich('team-1', [], member('m-1'))).resolves.toEqual([]);
    expect(availabilities.findByEvents).not.toHaveBeenCalled();
  });
});
