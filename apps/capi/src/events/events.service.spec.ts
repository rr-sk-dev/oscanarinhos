import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Clock } from '../availability/clock';
import { EventRepository } from './event.repository';
import { EventsService } from './events.service';
import { GameSyncService } from './game-sync.service';
import {
  EventDatesInvalidException,
  EventGameReadonlyException,
  EventNotFoundException,
  EventRangeInvalidException,
  EventTypeInvalidException,
} from './exceptions/event.exceptions';
import { EVENT_CANCELLED, EVENT_RESCHEDULED } from './types/event-change.events';
import { EventEntity } from './types/event.entity';

const TEAM = 'team-1';
const ACTOR = 'user-1';
const NOW = new Date('2026-11-20T12:00:00Z');

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

describe('EventsService', () => {
  let service: EventsService;
  let repository: jest.Mocked<EventRepository>;
  let gameSync: jest.Mocked<GameSyncService>;
  let emitter: { emit: jest.Mock };

  beforeEach(() => {
    repository = {
      findByTeamBetween: jest.fn(),
      findByIdInTeam: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      createIfAbsent: jest.fn(),
      createMany: jest.fn(),
      findByMatchIds: jest.fn(),
    } as jest.Mocked<EventRepository>;
    gameSync = {
      syncTeam: jest.fn().mockResolvedValue({ created: 0, updated: 0 }),
    } as unknown as jest.Mocked<GameSyncService>;
    emitter = { emit: jest.fn() };
    const clock: Clock = { now: () => NOW };
    service = new EventsService(repository, gameSync, emitter as unknown as EventEmitter2, clock);
  });

  describe('list', () => {
    it('still lists the events when the game sync throws unexpectedly', async () => {
      gameSync.syncTeam.mockRejectedValue(new Error('boom'));
      repository.findByTeamBetween.mockResolvedValue([event()]);
      const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();

      await expect(
        service.list(TEAM, new Date('2026-12-01T00:00:00Z'), new Date('2026-12-31T00:00:00Z')),
      ).resolves.toHaveLength(1);
      expect(logger).toHaveBeenCalled();
      logger.mockRestore();
    });

    it('lists the events of the team in the range', async () => {
      repository.findByTeamBetween.mockResolvedValue([event()]);
      const from = new Date('2026-12-01T00:00:00Z');
      const to = new Date('2026-12-31T00:00:00Z');

      await expect(service.list(TEAM, from, to)).resolves.toHaveLength(1);
      expect(repository.findByTeamBetween).toHaveBeenCalledWith(TEAM, from, to);
    });

    it('syncs the games of the team before listing, so the calendar never misses one', async () => {
      const order: string[] = [];
      gameSync.syncTeam.mockImplementation(async () => {
        order.push('sync');
        return { created: 1, updated: 0 };
      });
      repository.findByTeamBetween.mockImplementation(async () => {
        order.push('find');
        return [];
      });

      await service.list(TEAM, new Date('2026-12-01T00:00:00Z'), new Date('2026-12-31T00:00:00Z'));

      expect(gameSync.syncTeam).toHaveBeenCalledWith(TEAM);
      expect(order).toEqual(['sync', 'find']);
    });

    it('does not sync when the range is invalid', async () => {
      const from = new Date('2026-12-31T00:00:00Z');
      const to = new Date('2026-12-01T00:00:00Z');

      await expect(service.list(TEAM, from, to)).rejects.toBeInstanceOf(EventRangeInvalidException);
      expect(gameSync.syncTeam).not.toHaveBeenCalled();
    });

    it('rejects a range over 400 days', async () => {
      const from = new Date('2026-01-01T00:00:00Z');
      const to = new Date('2027-03-01T00:00:00Z');

      await expect(service.list(TEAM, from, to)).rejects.toBeInstanceOf(EventRangeInvalidException);
      expect(repository.findByTeamBetween).not.toHaveBeenCalled();
    });

    it('accepts a range of exactly 400 days', async () => {
      repository.findByTeamBetween.mockResolvedValue([]);
      const from = new Date('2026-01-01T00:00:00Z');
      const to = new Date(from.getTime() + 400 * 24 * 60 * 60 * 1000);

      await expect(service.list(TEAM, from, to)).resolves.toEqual([]);
    });

    it('rejects from not before to', async () => {
      const same = new Date('2026-01-01T00:00:00Z');

      await expect(service.list(TEAM, same, same)).rejects.toBeInstanceOf(
        EventRangeInvalidException,
      );
    });
  });

  describe('get', () => {
    it('returns the event of the team', async () => {
      repository.findByIdInTeam.mockResolvedValue(event());

      await expect(service.get(TEAM, 'event-1')).resolves.toEqual(event());
      expect(repository.findByIdInTeam).toHaveBeenCalledWith(TEAM, 'event-1');
    });

    it('throws not found for an event of another team', async () => {
      repository.findByIdInTeam.mockResolvedValue(null);

      await expect(service.get(TEAM, 'other-team-event')).rejects.toBeInstanceOf(
        EventNotFoundException,
      );
    });
  });

  describe('create', () => {
    const input = {
      type: 'TRAINING' as const,
      title: 'Treino',
      startsAt: '2026-12-01T19:00:00.000Z',
    };

    it('creates a training event in the team with dates converted', async () => {
      repository.create.mockResolvedValue(event());

      await service.create(TEAM, {
        ...input,
        endsAt: '2026-12-01T20:30:00.000Z',
        respondBy: '2026-11-30T12:00:00.000Z',
        location: 'Campo',
      });

      expect(repository.create).toHaveBeenCalledWith({
        teamId: TEAM,
        type: 'TRAINING',
        title: 'Treino',
        startsAt: new Date('2026-12-01T19:00:00.000Z'),
        endsAt: new Date('2026-12-01T20:30:00.000Z'),
        location: 'Campo',
        notes: null,
        respondBy: new Date('2026-11-30T12:00:00.000Z'),
      });
    });

    it('creates a custom event', async () => {
      repository.create.mockResolvedValue(event({ type: 'CUSTOM' }));

      await expect(service.create(TEAM, { ...input, type: 'CUSTOM' })).resolves.toBeDefined();
    });

    it('rejects GAME events', async () => {
      await expect(service.create(TEAM, { ...input, type: 'GAME' })).rejects.toBeInstanceOf(
        EventTypeInvalidException,
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it.each(['startsAt', 'endsAt', 'respondBy'])('rejects an unparseable %s', async (field) => {
      await expect(
        service.create(TEAM, { ...input, [field]: '2026-02-30T10:00:00Z' }),
      ).rejects.toBeInstanceOf(EventDatesInvalidException);
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejects endsAt before startsAt', async () => {
      await expect(
        service.create(TEAM, { ...input, endsAt: '2026-12-01T18:00:00.000Z' }),
      ).rejects.toBeInstanceOf(EventDatesInvalidException);
    });

    it('rejects endsAt equal to startsAt', async () => {
      await expect(
        service.create(TEAM, { ...input, endsAt: input.startsAt }),
      ).rejects.toBeInstanceOf(EventDatesInvalidException);
    });

    it('rejects respondBy after startsAt', async () => {
      await expect(
        service.create(TEAM, { ...input, respondBy: '2026-12-02T00:00:00.000Z' }),
      ).rejects.toBeInstanceOf(EventDatesInvalidException);
    });

    it('rejects respondBy equal to startsAt', async () => {
      await expect(
        service.create(TEAM, { ...input, respondBy: input.startsAt }),
      ).rejects.toBeInstanceOf(EventDatesInvalidException);
    });
  });

  describe('update', () => {
    it('throws not found when the event belongs to another team', async () => {
      repository.findByIdInTeam.mockResolvedValue(null);

      await expect(
        service.update(TEAM, 'other-team-event', { title: 'x' }, ACTOR),
      ).rejects.toBeInstanceOf(EventNotFoundException);
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('updates through the team-scoped repository update', async () => {
      repository.findByIdInTeam.mockResolvedValue(event());
      repository.update.mockResolvedValue(event({ title: 'Novo' }));

      await service.update(TEAM, 'event-1', { title: 'Novo', location: null }, ACTOR);

      expect(repository.update).toHaveBeenCalledWith(TEAM, 'event-1', {
        title: 'Novo',
        location: null,
      });
    });

    it('throws not found when the scoped update matches nothing', async () => {
      repository.findByIdInTeam.mockResolvedValue(event());
      repository.update.mockResolvedValue(null);

      await expect(service.update(TEAM, 'event-1', { title: 'x' }, ACTOR)).rejects.toBeInstanceOf(
        EventNotFoundException,
      );
    });

    it('cancels and re-instates a non-game event', async () => {
      repository.findByIdInTeam.mockResolvedValue(event());
      repository.update.mockResolvedValue(event({ status: 'CANCELED' }));

      await service.update(TEAM, 'event-1', { status: 'CANCELED' }, ACTOR);
      await service.update(TEAM, 'event-1', { status: 'SCHEDULED' }, ACTOR);

      expect(repository.update).toHaveBeenNthCalledWith(1, TEAM, 'event-1', { status: 'CANCELED' });
      expect(repository.update).toHaveBeenNthCalledWith(2, TEAM, 'event-1', {
        status: 'SCHEDULED',
      });
    });

    it.each(['startsAt', 'endsAt', 'respondBy'])(
      'rejects an unparseable %s on patch',
      async (field) => {
        repository.findByIdInTeam.mockResolvedValue(event());

        await expect(
          service.update(TEAM, 'event-1', { [field]: '2026-02-30T10:00:00Z' }, ACTOR),
        ).rejects.toBeInstanceOf(EventDatesInvalidException);
        expect(repository.update).not.toHaveBeenCalled();
      },
    );

    it('validates the merged dates against the stored event', async () => {
      repository.findByIdInTeam.mockResolvedValue(
        event({
          startsAt: new Date('2026-12-01T19:00:00Z'),
          endsAt: new Date('2026-12-01T20:00:00Z'),
        }),
      );

      await expect(
        service.update(TEAM, 'event-1', { startsAt: '2026-12-01T21:00:00.000Z' }, ACTOR),
      ).rejects.toBeInstanceOf(EventDatesInvalidException);
    });

    it('allows clearing endsAt and respondBy with null', async () => {
      repository.findByIdInTeam.mockResolvedValue(
        event({ endsAt: new Date('2026-12-01T20:00:00Z') }),
      );
      repository.update.mockResolvedValue(event());

      await service.update(TEAM, 'event-1', { endsAt: null, respondBy: null }, ACTOR);

      expect(repository.update).toHaveBeenCalledWith(TEAM, 'event-1', {
        endsAt: null,
        respondBy: null,
      });
    });

    describe('notifying the team', () => {
      const oldStart = new Date('2026-12-01T19:00:00Z');
      const newStart = new Date('2026-12-02T19:00:00Z');

      it('emits event.cancelled once with the payload when notifyTeam is true', async () => {
        repository.findByIdInTeam.mockResolvedValue(
          event({ startsAt: oldStart, title: 'Treino', location: 'Campo' }),
        );
        repository.update.mockResolvedValue(
          event({ startsAt: oldStart, title: 'Treino', location: 'Campo', status: 'CANCELED' }),
        );

        await service.update(TEAM, 'event-1', { status: 'CANCELED', notifyTeam: true }, ACTOR);

        expect(emitter.emit).toHaveBeenCalledTimes(1);
        expect(emitter.emit).toHaveBeenCalledWith(EVENT_CANCELLED, {
          teamId: TEAM,
          eventId: 'event-1',
          title: 'Treino',
          location: 'Campo',
          previousStartsAt: oldStart,
          startsAt: oldStart,
          actorUserId: ACTOR,
        });
      });

      it('does not store notifyTeam', async () => {
        repository.findByIdInTeam.mockResolvedValue(event());
        repository.update.mockResolvedValue(event({ status: 'CANCELED' }));

        await service.update(TEAM, 'event-1', { status: 'CANCELED', notifyTeam: true }, ACTOR);

        expect(repository.update).toHaveBeenCalledWith(TEAM, 'event-1', { status: 'CANCELED' });
      });

      it('emits nothing on cancel without notifyTeam', async () => {
        repository.findByIdInTeam.mockResolvedValue(event());
        repository.update.mockResolvedValue(event({ status: 'CANCELED' }));

        await service.update(TEAM, 'event-1', { status: 'CANCELED' }, ACTOR);

        expect(emitter.emit).not.toHaveBeenCalled();
      });

      it('emits nothing when notifyTeam is false', async () => {
        repository.findByIdInTeam.mockResolvedValue(event());
        repository.update.mockResolvedValue(event({ status: 'CANCELED' }));

        await service.update(TEAM, 'event-1', { status: 'CANCELED', notifyTeam: false }, ACTOR);

        expect(emitter.emit).not.toHaveBeenCalled();
      });

      it('emits event.rescheduled with the old and new start', async () => {
        repository.findByIdInTeam.mockResolvedValue(event({ startsAt: oldStart }));
        repository.update.mockResolvedValue(event({ startsAt: newStart }));

        await service.update(
          TEAM,
          'event-1',
          { startsAt: newStart.toISOString(), notifyTeam: true },
          ACTOR,
        );

        expect(emitter.emit).toHaveBeenCalledTimes(1);
        expect(emitter.emit).toHaveBeenCalledWith(
          EVENT_RESCHEDULED,
          expect.objectContaining({
            previousStartsAt: oldStart,
            startsAt: newStart,
            actorUserId: ACTOR,
          }),
        );
      });

      it('emits only event.cancelled when a patch cancels and moves', async () => {
        repository.findByIdInTeam.mockResolvedValue(event({ startsAt: oldStart }));
        repository.update.mockResolvedValue(event({ startsAt: newStart, status: 'CANCELED' }));

        await service.update(
          TEAM,
          'event-1',
          { status: 'CANCELED', startsAt: newStart.toISOString(), notifyTeam: true },
          ACTOR,
        );

        expect(emitter.emit).toHaveBeenCalledTimes(1);
        expect(emitter.emit).toHaveBeenCalledWith(EVENT_CANCELLED, expect.anything());
      });

      it('emits nothing for a title-only edit', async () => {
        repository.findByIdInTeam.mockResolvedValue(event());
        repository.update.mockResolvedValue(event({ title: 'Novo' }));

        await service.update(TEAM, 'event-1', { title: 'Novo', notifyTeam: true }, ACTOR);

        expect(emitter.emit).not.toHaveBeenCalled();
      });

      it('emits only after the repository update resolves', async () => {
        const order: string[] = [];
        repository.findByIdInTeam.mockResolvedValue(event());
        repository.update.mockImplementation(async () => {
          order.push('update');
          return event({ status: 'CANCELED' });
        });
        emitter.emit.mockImplementation(() => {
          order.push('emit');
        });

        await service.update(TEAM, 'event-1', { status: 'CANCELED', notifyTeam: true }, ACTOR);

        expect(order).toEqual(['update', 'emit']);
      });

      it('still returns the updated event and logs when emit throws', async () => {
        const updated = event({ status: 'CANCELED' });
        repository.findByIdInTeam.mockResolvedValue(event());
        repository.update.mockResolvedValue(updated);
        emitter.emit.mockImplementation(() => {
          throw new Error('boom');
        });
        const logger = jest.spyOn(Logger.prototype, 'error').mockImplementation();

        await expect(
          service.update(TEAM, 'event-1', { status: 'CANCELED', notifyTeam: true }, ACTOR),
        ).resolves.toBe(updated);
        expect(logger).toHaveBeenCalled();
        logger.mockRestore();
      });
    });

    describe('GAME events', () => {
      const game = () => event({ type: 'GAME', matchId: 'match-1' });

      it.each([
        ['startsAt', { startsAt: '2026-12-02T19:00:00.000Z' }],
        ['endsAt', { endsAt: '2026-12-02T20:00:00.000Z' }],
        ['location', { location: 'Outro campo' }],
        ['status', { status: 'CANCELED' as const }],
        ['title', { title: 'Outro' }],
      ])('refuses to change %s', async (_field, patch) => {
        repository.findByIdInTeam.mockResolvedValue(game());

        await expect(service.update(TEAM, 'event-1', patch, ACTOR)).rejects.toBeInstanceOf(
          EventGameReadonlyException,
        );
        expect(repository.update).not.toHaveBeenCalled();
      });

      it('still refuses a patch that carries notifyTeam', async () => {
        repository.findByIdInTeam.mockResolvedValue(game());

        await expect(
          service.update(TEAM, 'event-1', { notes: 'x', notifyTeam: true }, ACTOR),
        ).rejects.toBeInstanceOf(EventGameReadonlyException);
      });

      it('allows changing notes', async () => {
        repository.findByIdInTeam.mockResolvedValue(game());
        repository.update.mockResolvedValue(game());

        await service.update(TEAM, 'event-1', { notes: 'Levar equipamento' }, ACTOR);

        expect(repository.update).toHaveBeenCalledWith(TEAM, 'event-1', {
          notes: 'Levar equipamento',
        });
      });
    });
  });
});
