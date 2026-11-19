import { EventRepository } from '../events/event.repository';
import { EventNotFoundException } from '../events/exceptions/event.exceptions';
import { EventEntity } from '../events/types/event.entity';
import { MembershipRepository } from '../members/membership.repository';
import { MembershipEntity } from '../members/types/membership.entity';
import { AvailabilityRepository } from './availability.repository';
import { AvailabilityService } from './availability.service';
import { EventClosedForbiddenException } from './exceptions/availability.exceptions';
import { AvailabilityEntity } from './types/availability.entity';

const TEAM = 'team-1';
const NOW = new Date('2026-12-01T10:00:00Z');

const event = (overrides: Partial<EventEntity> = {}): EventEntity => ({
  id: 'event-1',
  teamId: TEAM,
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
  ...overrides,
});

const member = (id: string, overrides: Partial<MembershipEntity> = {}): MembershipEntity => ({
  id,
  userId: `user-${id}`,
  teamId: TEAM,
  role: 'PLAYER',
  playerId: null,
  staffId: null,
  displayName: `Member ${id}`,
  ...overrides,
});

const answer = (
  membershipId: string,
  value: AvailabilityEntity['answer'],
  note: string | null = null,
): AvailabilityEntity => ({
  id: `a-${membershipId}`,
  eventId: 'event-1',
  membershipId,
  answer: value,
  note,
});

describe('AvailabilityService', () => {
  let service: AvailabilityService;
  let events: jest.Mocked<EventRepository>;
  let memberships: jest.Mocked<MembershipRepository>;
  let availabilities: jest.Mocked<AvailabilityRepository>;

  beforeEach(() => {
    events = { findByIdInTeam: jest.fn() } as unknown as jest.Mocked<EventRepository>;
    memberships = { findByTeam: jest.fn() } as unknown as jest.Mocked<MembershipRepository>;
    availabilities = {
      upsert: jest.fn().mockImplementation(async (data) => ({ id: 'a-1', ...data })),
      findByEvent: jest.fn(),
      findByEvents: jest.fn(),
    } as jest.Mocked<AvailabilityRepository>;
    service = new AvailabilityService(events, memberships, availabilities);
  });

  describe('respond', () => {
    const me = member('m-1');

    it('upserts on (event, membership), so answering twice changes the same row', async () => {
      events.findByIdInTeam.mockResolvedValue(event());

      await service.respond(TEAM, 'event-1', me, { answer: 'YES' }, NOW);
      await service.respond(TEAM, 'event-1', me, { answer: 'NO', note: ' lesionado ' }, NOW);

      expect(availabilities.upsert).toHaveBeenNthCalledWith(1, {
        eventId: 'event-1',
        membershipId: 'm-1',
        answer: 'YES',
        note: null,
      });
      expect(availabilities.upsert).toHaveBeenNthCalledWith(2, {
        eventId: 'event-1',
        membershipId: 'm-1',
        answer: 'NO',
        note: 'lesionado',
      });
    });

    it('stores a blank note as null', async () => {
      events.findByIdInTeam.mockResolvedValue(event());

      await service.respond(TEAM, 'event-1', me, { answer: 'MAYBE', note: '   ' }, NOW);

      expect(availabilities.upsert).toHaveBeenCalledWith(expect.objectContaining({ note: null }));
    });

    it('rejects answers once the event has started', async () => {
      events.findByIdInTeam.mockResolvedValue(
        event({ startsAt: new Date('2026-12-01T10:00:00Z') }),
      );

      await expect(service.respond(TEAM, 'event-1', me, { answer: 'YES' }, NOW)).rejects.toThrow(
        EventClosedForbiddenException,
      );
      expect(availabilities.upsert).not.toHaveBeenCalled();
    });

    it('rejects answers for a canceled event', async () => {
      events.findByIdInTeam.mockResolvedValue(event({ status: 'CANCELED' }));

      await expect(service.respond(TEAM, 'event-1', me, { answer: 'YES' }, NOW)).rejects.toThrow(
        EventClosedForbiddenException,
      );
    });

    it('rejects answers after respondBy even though the event has not started', async () => {
      events.findByIdInTeam.mockResolvedValue(
        event({ respondBy: new Date('2026-12-01T09:00:00Z') }),
      );

      await expect(service.respond(TEAM, 'event-1', me, { answer: 'YES' }, NOW)).rejects.toThrow(
        EventClosedForbiddenException,
      );
    });

    it('treats an event of another team as not found', async () => {
      events.findByIdInTeam.mockResolvedValue(null);

      await expect(
        service.respond('team-2', 'event-1', me, { answer: 'YES' }, NOW),
      ).rejects.toThrow(EventNotFoundException);
      expect(events.findByIdInTeam).toHaveBeenCalledWith('team-2', 'event-1');
    });
  });

  describe('summary', () => {
    it('groups by answer and puts members without a row in noAnswer, staff included', async () => {
      events.findByIdInTeam.mockResolvedValue(event());
      memberships.findByTeam.mockResolvedValue([
        member('m-1'),
        member('m-2'),
        member('m-3', { role: 'STAFF' }),
        member('m-4', { role: 'COACH' }),
      ]);
      availabilities.findByEvent.mockResolvedValue([
        answer('m-1', 'YES'),
        answer('m-2', 'NO', 'trabalho'),
        answer('m-4', 'MAYBE'),
      ]);

      const summary = await service.summary(TEAM, 'event-1');

      expect(summary.yes.map((entry) => entry.membershipId)).toEqual(['m-1']);
      expect(summary.no).toEqual([
        { membershipId: 'm-2', displayName: 'Member m-2', role: 'PLAYER', note: 'trabalho' },
      ]);
      expect(summary.maybe.map((entry) => entry.membershipId)).toEqual(['m-4']);
      expect(summary.noAnswer).toEqual([
        { membershipId: 'm-3', displayName: 'Member m-3', role: 'STAFF', note: null },
      ]);
    });

    it('ignores answers from memberships that left the team', async () => {
      events.findByIdInTeam.mockResolvedValue(event());
      memberships.findByTeam.mockResolvedValue([member('m-1')]);
      availabilities.findByEvent.mockResolvedValue([answer('gone', 'YES')]);

      const summary = await service.summary(TEAM, 'event-1');

      expect(summary.yes).toEqual([]);
      expect(summary.noAnswer.map((entry) => entry.membershipId)).toEqual(['m-1']);
    });

    it('treats an event of another team as not found', async () => {
      events.findByIdInTeam.mockResolvedValue(null);

      await expect(service.summary('team-2', 'event-1')).rejects.toThrow(EventNotFoundException);
      expect(availabilities.findByEvent).not.toHaveBeenCalled();
    });
  });
});
