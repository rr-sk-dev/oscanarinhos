import { CURRENT_SEASON_KICKOFFS } from '../scrapper/cif.constants';
import { MatchRepository } from '../matches/matches.repository';
import { MatchEntity } from '../matches/types/match.entity';
import { EventRepository } from './event.repository';
import { GameSyncService } from './game-sync.service';
import { CreateEventData, EventEntity, UpdateEventData } from './types/event.entity';

const TEAM = 'team-1';
const OPPONENT = 'team-2';
const OTHER = 'team-3';

const match = (overrides: Partial<MatchEntity> = {}): MatchEntity =>
  ({
    id: 'match-1',
    journey: 1,
    kickoffAt: new Date('2026-12-06T10:00:00Z'),
    label: 'Jornada 1',
    status: 'SCHEDULED',
    homeTeamId: TEAM,
    awayTeamId: OPPONENT,
    homeScore: null,
    awayScore: null,
    location: 'Campo A',
    videoId: null,
    events: null,
    lineups: null,
    homeTeam: { id: TEAM, name: 'Canarinhos' },
    awayTeam: { id: OPPONENT, name: 'Rival FC' },
    ...overrides,
  }) as MatchEntity;

describe('GameSyncService', () => {
  let service: GameSyncService;
  let matchRepository: jest.Mocked<MatchRepository>;
  let eventRepository: jest.Mocked<EventRepository>;
  let stored: EventEntity[];
  let nextId: number;

  beforeEach(() => {
    stored = [];
    nextId = 1;
    matchRepository = { findAllByTeam: jest.fn() } as unknown as jest.Mocked<MatchRepository>;
    eventRepository = {
      findByMatchIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<EventRepository>;
    // A tiny in-memory store so idempotency is observable.
    eventRepository.findByMatchIds.mockImplementation(async (teamId, matchIds) =>
      stored.filter((e) => e.teamId === teamId && e.matchId && matchIds.includes(e.matchId)),
    );
    eventRepository.create.mockImplementation(async (data: CreateEventData) => {
      const created: EventEntity = {
        status: 'SCHEDULED',
        matchId: null,
        seriesId: null,
        ...data,
        id: `event-${nextId++}`,
      };
      stored.push(created);
      return created;
    });
    eventRepository.update.mockImplementation(async (_team, id, data: UpdateEventData) => {
      const event = stored.find((e) => e.id === id);
      if (!event) {
        return null;
      }
      Object.assign(event, data);
      return event;
    });
    service = new GameSyncService(matchRepository, eventRepository);
  });

  it('creates a GAME event for a new match', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match()]);

    await expect(service.syncTeam(TEAM)).resolves.toEqual({ created: 1, updated: 0 });

    expect(eventRepository.create).toHaveBeenCalledWith({
      teamId: TEAM,
      type: 'GAME',
      title: 'Canarinhos vs Rival FC',
      startsAt: new Date('2026-12-06T10:00:00Z'),
      endsAt: null,
      location: 'Campo A',
      notes: null,
      respondBy: null,
      status: 'SCHEDULED',
      matchId: 'match-1',
    });
  });

  it('is idempotent: running twice creates the event once and the second run changes nothing', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match()]);

    await service.syncTeam(TEAM);
    await expect(service.syncTeam(TEAM)).resolves.toEqual({ created: 0, updated: 0 });

    expect(stored).toHaveLength(1);
    expect(eventRepository.create).toHaveBeenCalledTimes(1);
    expect(eventRepository.update).not.toHaveBeenCalled();
  });

  it('keeps the same event id when the kickoff changes', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match()]);
    await service.syncTeam(TEAM);
    const originalId = stored[0].id;

    matchRepository.findAllByTeam.mockResolvedValue([
      match({ kickoffAt: new Date('2026-12-13T11:30:00Z') }),
    ]);
    await expect(service.syncTeam(TEAM)).resolves.toEqual({ created: 0, updated: 1 });

    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(originalId);
    expect(stored[0].startsAt).toEqual(new Date('2026-12-13T11:30:00Z'));
    expect(eventRepository.update).toHaveBeenCalledWith(TEAM, originalId, {
      startsAt: new Date('2026-12-13T11:30:00Z'),
    });
  });

  it.each(['POSTPONED', 'CANCELED'] as const)(
    'cancels the event when the match is %s',
    async (status) => {
      matchRepository.findAllByTeam.mockResolvedValue([match()]);
      await service.syncTeam(TEAM);

      matchRepository.findAllByTeam.mockResolvedValue([match({ status })]);
      await service.syncTeam(TEAM);

      expect(stored[0].status).toBe('CANCELED');
    },
  );

  it('flips back to SCHEDULED when a postponed match gets a new date', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match({ status: 'POSTPONED' })]);
    await service.syncTeam(TEAM);
    const originalId = stored[0].id;
    expect(stored[0].status).toBe('CANCELED');

    matchRepository.findAllByTeam.mockResolvedValue([
      match({ status: 'SCHEDULED', kickoffAt: new Date('2027-01-10T10:00:00Z') }),
    ]);
    await service.syncTeam(TEAM);

    expect(stored).toHaveLength(1);
    expect(stored[0].id).toBe(originalId);
    expect(stored[0].status).toBe('SCHEDULED');
    expect(stored[0].startsAt).toEqual(new Date('2027-01-10T10:00:00Z'));
  });

  it('treats finished and in-progress matches as scheduled', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([
      match({ id: 'm-a', status: 'FINISHED' }),
      match({ id: 'm-b', status: 'IN_PROGRESS' }),
    ]);

    await service.syncTeam(TEAM);

    expect(stored.map((e) => e.status)).toEqual(['SCHEDULED', 'SCHEDULED']);
  });

  it('syncs matches where the team plays away too', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([
      match({
        homeTeamId: OPPONENT,
        awayTeamId: TEAM,
        homeTeam: { id: OPPONENT, name: 'Rival FC' } as never,
        awayTeam: { id: TEAM, name: 'Canarinhos' } as never,
      }),
    ]);

    await service.syncTeam(TEAM);

    expect(stored[0].title).toBe('Rival FC vs Canarinhos');
  });

  it('ignores matches that do not involve the team', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([
      match({ id: 'm-x', homeTeamId: OPPONENT, awayTeamId: OTHER }),
    ]);

    await expect(service.syncTeam(TEAM)).resolves.toEqual({ created: 0, updated: 0 });

    expect(stored).toHaveLength(0);
  });

  it('ignores matches outside the current season window', async () => {
    const { kickoffFrom, kickoffTo } = CURRENT_SEASON_KICKOFFS;
    matchRepository.findAllByTeam.mockResolvedValue([
      match({ id: 'before', kickoffAt: new Date(kickoffFrom.getTime() - 1) }),
      match({ id: 'after', kickoffAt: kickoffTo }),
      match({ id: 'inside', kickoffAt: kickoffFrom }),
    ]);

    await expect(service.syncTeam(TEAM)).resolves.toEqual({ created: 1, updated: 0 });

    expect(stored.map((e) => e.matchId)).toEqual(['inside']);
  });

  it('never overwrites notes and only sends the changed content fields', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match()]);
    await service.syncTeam(TEAM);
    stored[0].notes = 'Levar coletes';

    matchRepository.findAllByTeam.mockResolvedValue([match({ location: 'Campo B' })]);
    await service.syncTeam(TEAM);

    expect(stored[0].notes).toBe('Levar coletes');
    expect(eventRepository.update).toHaveBeenCalledWith(TEAM, stored[0].id, {
      location: 'Campo B',
    });
  });
});
