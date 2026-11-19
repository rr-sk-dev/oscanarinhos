import { Clock } from '../availability/clock';
import { CURRENT_SEASON_KICKOFFS } from '../scrapper/cif.constants';
import { MembershipRepository } from '../members/membership.repository';
import { MembershipEntity } from '../members/types/membership.entity';
import { AttendanceRepository } from './attendance.repository';
import { StatsRangeInvalidException } from './exceptions/attendance.exceptions';
import { resolveStatsRange, StatsService } from './stats.service';
import { AttendanceRecord } from './types/attendance.entity';

const TEAM = 'team-1';
const NOW = new Date('2026-12-10T12:00:00Z');
const FROM = new Date('2026-09-01T00:00:00Z');
const TO = new Date('2027-07-01T00:00:00Z');

const member = (id: string): MembershipEntity => ({
  id,
  userId: `user-${id}`,
  teamId: TEAM,
  role: 'PLAYER',
  playerId: null,
  staffId: null,
  displayName: `Member ${id}`,
});

const row = (overrides: Partial<AttendanceRecord> = {}): AttendanceRecord => ({
  eventId: 'e-1',
  membershipId: 'm-1',
  attended: true,
  eventType: 'TRAINING',
  eventStatus: 'SCHEDULED',
  eventStartsAt: new Date('2026-11-01T19:00:00Z'),
  ...overrides,
});

describe('StatsService', () => {
  let service: StatsService;
  let memberships: jest.Mocked<MembershipRepository>;
  let attendances: jest.Mocked<AttendanceRepository>;

  beforeEach(() => {
    memberships = {
      findByTeam: jest.fn().mockResolvedValue([member('m-1'), member('m-2')]),
    } as unknown as jest.Mocked<MembershipRepository>;
    attendances = {
      upsertMany: jest.fn(),
      findByTeamBetween: jest.fn(),
    } as jest.Mocked<AttendanceRepository>;
    const clock: Clock = { now: () => NOW };
    service = new StatsService(memberships, attendances, clock);
  });

  it('rounds 2 of 3 attended to 67 and gives members with no marks 0, not NaN', async () => {
    attendances.findByTeamBetween.mockResolvedValue([
      row({ eventId: 'e-1', attended: true }),
      row({ eventId: 'e-2', attended: true }),
      row({ eventId: 'e-3', attended: false }),
    ]);

    const stats = await service.get(TEAM, FROM, TO);

    expect(attendances.findByTeamBetween).toHaveBeenCalledWith(TEAM, FROM, TO);
    expect(stats.members[0]).toMatchObject({ markedEvents: 3, attended: 2, attendancePercent: 67 });
    expect(stats.members[1]).toMatchObject({ markedEvents: 0, attended: 0, attendancePercent: 0 });
  });

  it('excludes canceled events and events that have not started yet', async () => {
    attendances.findByTeamBetween.mockResolvedValue([
      row({ eventId: 'e-1' }),
      row({ eventId: 'e-2', eventStatus: 'CANCELED' }),
      row({ eventId: 'e-3', eventStartsAt: new Date('2026-12-20T19:00:00Z') }),
    ]);

    const stats = await service.get(TEAM, FROM, TO);

    expect(stats.members[0].markedEvents).toBe(1);
    expect(stats.byType).toEqual([{ type: 'TRAINING', events: 1, averageAttended: 1 }]);
  });

  it('groups TRAINING and GAME separately with a one-decimal average', async () => {
    attendances.findByTeamBetween.mockResolvedValue([
      row({ eventId: 't-1', membershipId: 'm-1', attended: true }),
      row({ eventId: 't-1', membershipId: 'm-2', attended: true }),
      row({ eventId: 't-2', membershipId: 'm-1', attended: true }),
      row({ eventId: 't-2', membershipId: 'm-2', attended: false }),
      row({ eventId: 'g-1', membershipId: 'm-1', attended: true, eventType: 'GAME' }),
    ]);

    const stats = await service.get(TEAM, FROM, TO);

    expect(stats.byType).toEqual([
      { type: 'TRAINING', events: 2, averageAttended: 1.5 },
      { type: 'GAME', events: 1, averageAttended: 1 },
    ]);
  });
});

describe('resolveStatsRange', () => {
  it('defaults to the current season window', () => {
    expect(resolveStatsRange()).toEqual({
      from: CURRENT_SEASON_KICKOFFS.kickoffFrom,
      to: CURRENT_SEASON_KICKOFFS.kickoffTo,
    });
  });

  it('rejects from not before to', () => {
    expect(() => resolveStatsRange(TO, FROM)).toThrow(StatsRangeInvalidException);
    expect(() => resolveStatsRange(FROM, FROM)).toThrow(StatsRangeInvalidException);
  });
});
