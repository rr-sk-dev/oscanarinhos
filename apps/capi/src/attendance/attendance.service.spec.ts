import { EventRepository } from '../events/event.repository';
import { EventNotFoundException } from '../events/exceptions/event.exceptions';
import { EventEntity } from '../events/types/event.entity';
import { MembershipNotFoundException } from '../members/exceptions/members.exceptions';
import { MembershipRepository } from '../members/membership.repository';
import { MembershipEntity } from '../members/types/membership.entity';
import { AttendanceRepository } from './attendance.repository';
import { AttendanceService } from './attendance.service';
import {
  EventCanceledForbiddenException,
  EventNotStartedForbiddenException,
} from './exceptions/attendance.exceptions';

const TEAM = 'team-1';
const NOW = new Date('2026-12-01T21:00:00Z');

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

const member = (id: string): MembershipEntity => ({
  id,
  userId: `user-${id}`,
  teamId: TEAM,
  role: 'PLAYER',
  playerId: null,
  staffId: null,
  displayName: `Member ${id}`,
});

describe('AttendanceService', () => {
  let service: AttendanceService;
  let events: jest.Mocked<EventRepository>;
  let memberships: jest.Mocked<MembershipRepository>;
  let attendances: jest.Mocked<AttendanceRepository>;

  beforeEach(() => {
    events = { findByIdInTeam: jest.fn() } as unknown as jest.Mocked<EventRepository>;
    memberships = {
      findByTeam: jest.fn().mockResolvedValue([member('m-1'), member('m-2')]),
    } as unknown as jest.Mocked<MembershipRepository>;
    attendances = {
      upsertMany: jest.fn().mockResolvedValue(undefined),
      findByTeamBetween: jest.fn(),
      findByEvent: jest.fn(),
    } as jest.Mocked<AttendanceRepository>;
    service = new AttendanceService(events, memberships, attendances);
  });

  it('rejects marking before the event starts', async () => {
    events.findByIdInTeam.mockResolvedValue(event({ startsAt: new Date('2026-12-02T19:00:00Z') }));

    await expect(
      service.mark(TEAM, 'event-1', [{ membershipId: 'm-1', attended: true }], NOW),
    ).rejects.toBeInstanceOf(EventNotStartedForbiddenException);
    expect(attendances.upsertMany).not.toHaveBeenCalled();
  });

  it('rejects marking a canceled event', async () => {
    events.findByIdInTeam.mockResolvedValue(event({ status: 'CANCELED' }));

    await expect(
      service.mark(TEAM, 'event-1', [{ membershipId: 'm-1', attended: true }], NOW),
    ).rejects.toBeInstanceOf(EventCanceledForbiddenException);
  });

  it('answers 404 for an event of another team', async () => {
    events.findByIdInTeam.mockResolvedValue(null);

    await expect(service.mark(TEAM, 'other', [], NOW)).rejects.toBeInstanceOf(
      EventNotFoundException,
    );
  });

  it('answers 404 when a membership belongs to another team, writing nothing', async () => {
    events.findByIdInTeam.mockResolvedValue(event());

    await expect(
      service.mark(
        TEAM,
        'event-1',
        [
          { membershipId: 'm-1', attended: true },
          { membershipId: 'foreign', attended: true },
        ],
        NOW,
      ),
    ).rejects.toBeInstanceOf(MembershipNotFoundException);
    expect(attendances.upsertMany).not.toHaveBeenCalled();
  });

  it('upserts, so marking twice changes the same rows', async () => {
    events.findByIdInTeam.mockResolvedValue(event());
    const first = [{ membershipId: 'm-1', attended: true }];
    const second = [{ membershipId: 'm-1', attended: false }];

    await service.mark(TEAM, 'event-1', first, NOW);
    await service.mark(TEAM, 'event-1', second, NOW);

    expect(attendances.upsertMany).toHaveBeenNthCalledWith(1, 'event-1', first);
    expect(attendances.upsertMany).toHaveBeenNthCalledWith(2, 'event-1', second);
  });

  it('keeps the last entry when a membership appears twice', async () => {
    events.findByIdInTeam.mockResolvedValue(event());

    await service.mark(
      TEAM,
      'event-1',
      [
        { membershipId: 'm-1', attended: true },
        { membershipId: 'm-2', attended: true },
        { membershipId: 'm-1', attended: false },
      ],
      NOW,
    );

    expect(attendances.upsertMany).toHaveBeenCalledWith('event-1', [
      { membershipId: 'm-1', attended: false },
      { membershipId: 'm-2', attended: true },
    ]);
  });

  describe('list', () => {
    it('answers 404 for an event of another team', async () => {
      events.findByIdInTeam.mockResolvedValue(null);

      await expect(service.list(TEAM, 'other')).rejects.toBeInstanceOf(EventNotFoundException);
      expect(attendances.findByEvent).not.toHaveBeenCalled();
    });

    it('returns the saved marks of the event', async () => {
      events.findByIdInTeam.mockResolvedValue(event());
      attendances.findByEvent.mockResolvedValue([{ membershipId: 'm-1', attended: false }]);

      await expect(service.list(TEAM, 'event-1')).resolves.toEqual([
        { membershipId: 'm-1', attended: false },
      ]);
      expect(attendances.findByEvent).toHaveBeenCalledWith('event-1');
    });
  });
});
