import { EventEmitter2 } from '@nestjs/event-emitter';
import { Clock } from '../availability/clock';
import { CURRENT_SEASON_KICKOFFS } from '../scrapper/cif.constants';
import { MatchRepository } from '../matches/matches.repository';
import { MatchEntity } from '../matches/types/match.entity';
import { EventRepository } from './event.repository';
import { GameSyncService } from './game-sync.service';
import { EVENT_CANCELLED, EVENT_RESCHEDULED } from './types/event-change.events';
import { CreateEventData, EventEntity, UpdateEventData } from './types/event.entity';

const TEAM = 'team-1';
const OPPONENT = 'team-2';
const OTHER = 'team-3';
const NOW = new Date('2026-11-20T12:00:00Z');

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
  let emitter: { emit: jest.Mock };
  let stored: EventEntity[];
  let nextId: number;

  beforeEach(() => {
    stored = [];
    nextId = 1;
    matchRepository = { findAllByTeam: jest.fn() } as unknown as jest.Mocked<MatchRepository>;
    eventRepository = {
      findByMatchIds: jest.fn(),
      createIfAbsent: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<EventRepository>;
    // A tiny in-memory store so idempotency is observable.
    eventRepository.findByMatchIds.mockImplementation(async (teamId, matchIds) =>
      stored.filter((e) => e.teamId === teamId && e.matchId && matchIds.includes(e.matchId)),
    );
    eventRepository.createIfAbsent.mockImplementation(async (data: CreateEventData) => {
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
      // Replace instead of mutating: the repository hands back fresh objects, not the caller's.
      const updated = { ...event, ...data };
      stored[stored.indexOf(event)] = updated;
      return updated;
    });
    emitter = { emit: jest.fn() };
    const clock: Clock = { now: () => NOW };
    service = new GameSyncService(
      matchRepository,
      eventRepository,
      emitter as unknown as EventEmitter2,
      clock,
    );
  });

  it('creates a GAME event for a new match', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match()]);

    await expect(service.syncTeam(TEAM)).resolves.toEqual({ created: 1, updated: 0 });

    expect(eventRepository.createIfAbsent).toHaveBeenCalledWith({
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
    expect(eventRepository.createIfAbsent).toHaveBeenCalledTimes(1);
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

  it('cancels the event when the match is CANCELED', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match()]);
    await service.syncTeam(TEAM);

    matchRepository.findAllByTeam.mockResolvedValue([match({ status: 'CANCELED' })]);
    await service.syncTeam(TEAM);

    expect(stored[0].status).toBe('CANCELED');
  });

  it('keeps the event SCHEDULED when the match is POSTPONED (the scraper sets it for overdue games)', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match()]);
    await service.syncTeam(TEAM);

    matchRepository.findAllByTeam.mockResolvedValue([match({ status: 'POSTPONED' })]);
    await service.syncTeam(TEAM);

    expect(stored[0].status).toBe('SCHEDULED');
  });

  it('flips back to SCHEDULED when a canceled match gets a new date', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match({ status: 'CANCELED' })]);
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

  it('tolerates a concurrent creation: an event another run already created is not counted nor thrown', async () => {
    matchRepository.findAllByTeam.mockResolvedValue([match()]);
    eventRepository.createIfAbsent.mockResolvedValue(null);

    await expect(service.syncTeam(TEAM)).resolves.toEqual({ created: 0, updated: 0 });
  });

  describe('change events', () => {
    const seed = async () => {
      matchRepository.findAllByTeam.mockResolvedValue([match()]);
      await service.syncTeam(TEAM);
    };

    it('emits event.cancelled without an actor, after the repository update', async () => {
      await seed();
      matchRepository.findAllByTeam.mockResolvedValue([match({ status: 'CANCELED' })]);

      await service.syncTeam(TEAM);

      expect(emitter.emit).toHaveBeenCalledTimes(1);
      expect(emitter.emit).toHaveBeenCalledWith(EVENT_CANCELLED, {
        teamId: TEAM,
        eventId: stored[0].id,
        title: 'Canarinhos vs Rival FC',
        location: 'Campo A',
        previousStartsAt: new Date('2026-12-06T10:00:00Z'),
        startsAt: new Date('2026-12-06T10:00:00Z'),
        actorUserId: null,
      });
      expect(eventRepository.update.mock.invocationCallOrder[0]).toBeLessThan(
        emitter.emit.mock.invocationCallOrder[0],
      );
    });

    it('emits event.rescheduled when the kickoff changes', async () => {
      await seed();
      matchRepository.findAllByTeam.mockResolvedValue([
        match({ kickoffAt: new Date('2026-12-13T11:30:00Z') }),
      ]);

      await service.syncTeam(TEAM);

      expect(emitter.emit).toHaveBeenCalledWith(
        EVENT_RESCHEDULED,
        expect.objectContaining({
          previousStartsAt: new Date('2026-12-06T10:00:00Z'),
          startsAt: new Date('2026-12-13T11:30:00Z'),
          actorUserId: null,
        }),
      );
    });

    it('emits nothing for POSTPONED matches', async () => {
      await seed();
      matchRepository.findAllByTeam.mockResolvedValue([match({ status: 'POSTPONED' })]);

      await service.syncTeam(TEAM);

      expect(eventRepository.update).not.toHaveBeenCalled();
      expect(emitter.emit).not.toHaveBeenCalled();
    });

    it('emits once in total when synced twice against the same data', async () => {
      await seed();
      matchRepository.findAllByTeam.mockResolvedValue([match({ status: 'CANCELED' })]);

      await service.syncTeam(TEAM);
      await service.syncTeam(TEAM);

      expect(emitter.emit).toHaveBeenCalledTimes(1);
    });

    it('emits nothing when a canceled match comes back with a new kickoff', async () => {
      matchRepository.findAllByTeam.mockResolvedValue([match({ status: 'CANCELED' })]);
      await service.syncTeam(TEAM);
      matchRepository.findAllByTeam.mockResolvedValue([
        match({ status: 'SCHEDULED', kickoffAt: new Date('2027-01-10T10:00:00Z') }),
      ]);

      await service.syncTeam(TEAM);

      expect(emitter.emit).not.toHaveBeenCalled();
    });

    it('emits nothing for a newly created game event', async () => {
      await seed();

      expect(emitter.emit).not.toHaveBeenCalled();
    });

    it('does not reject when emit throws', async () => {
      await seed();
      emitter.emit.mockImplementation(() => {
        throw new Error('listener exploded');
      });
      matchRepository.findAllByTeam.mockResolvedValue([match({ status: 'CANCELED' })]);

      await expect(service.syncTeam(TEAM)).resolves.toEqual({ created: 0, updated: 1 });
    });
  });
});
