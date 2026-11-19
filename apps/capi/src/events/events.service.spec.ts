import { EventRepository } from './event.repository';
import { EventsService } from './events.service';
import {
  EventDatesInvalidException,
  EventGameReadonlyException,
  EventNotFoundException,
  EventRangeInvalidException,
  EventTypeInvalidException,
} from './exceptions/event.exceptions';
import { EventEntity } from './types/event.entity';

const TEAM = 'team-1';

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

  beforeEach(() => {
    repository = {
      findByTeamBetween: jest.fn(),
      findByIdInTeam: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      createMany: jest.fn(),
    } as jest.Mocked<EventRepository>;
    service = new EventsService(repository);
  });

  describe('list', () => {
    it('lists the events of the team in the range', async () => {
      repository.findByTeamBetween.mockResolvedValue([event()]);
      const from = new Date('2026-12-01T00:00:00Z');
      const to = new Date('2026-12-31T00:00:00Z');

      await expect(service.list(TEAM, from, to)).resolves.toHaveLength(1);
      expect(repository.findByTeamBetween).toHaveBeenCalledWith(TEAM, from, to);
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

      await expect(service.update(TEAM, 'other-team-event', { title: 'x' })).rejects.toBeInstanceOf(
        EventNotFoundException,
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('updates through the team-scoped repository update', async () => {
      repository.findByIdInTeam.mockResolvedValue(event());
      repository.update.mockResolvedValue(event({ title: 'Novo' }));

      await service.update(TEAM, 'event-1', { title: 'Novo', location: null });

      expect(repository.update).toHaveBeenCalledWith(TEAM, 'event-1', {
        title: 'Novo',
        location: null,
      });
    });

    it('throws not found when the scoped update matches nothing', async () => {
      repository.findByIdInTeam.mockResolvedValue(event());
      repository.update.mockResolvedValue(null);

      await expect(service.update(TEAM, 'event-1', { title: 'x' })).rejects.toBeInstanceOf(
        EventNotFoundException,
      );
    });

    it('cancels and re-instates a non-game event', async () => {
      repository.findByIdInTeam.mockResolvedValue(event());
      repository.update.mockResolvedValue(event({ status: 'CANCELED' }));

      await service.update(TEAM, 'event-1', { status: 'CANCELED' });
      await service.update(TEAM, 'event-1', { status: 'SCHEDULED' });

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
          service.update(TEAM, 'event-1', { [field]: '2026-02-30T10:00:00Z' }),
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
        service.update(TEAM, 'event-1', { startsAt: '2026-12-01T21:00:00.000Z' }),
      ).rejects.toBeInstanceOf(EventDatesInvalidException);
    });

    it('allows clearing endsAt and respondBy with null', async () => {
      repository.findByIdInTeam.mockResolvedValue(
        event({ endsAt: new Date('2026-12-01T20:00:00Z') }),
      );
      repository.update.mockResolvedValue(event());

      await service.update(TEAM, 'event-1', { endsAt: null, respondBy: null });

      expect(repository.update).toHaveBeenCalledWith(TEAM, 'event-1', {
        endsAt: null,
        respondBy: null,
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

        await expect(service.update(TEAM, 'event-1', patch)).rejects.toBeInstanceOf(
          EventGameReadonlyException,
        );
        expect(repository.update).not.toHaveBeenCalled();
      });

      it('allows changing notes', async () => {
        repository.findByIdInTeam.mockResolvedValue(game());
        repository.update.mockResolvedValue(game());

        await service.update(TEAM, 'event-1', { notes: 'Levar equipamento' });

        expect(repository.update).toHaveBeenCalledWith(TEAM, 'event-1', {
          notes: 'Levar equipamento',
        });
      });
    });
  });
});
