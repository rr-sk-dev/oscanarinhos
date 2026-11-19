import { DateTime } from 'luxon';
import { SeriesInvalidException } from './exceptions/series.exceptions';
import { SeriesRepository } from './series.repository';
import { SeriesService } from './series.service';
import { EventEntity } from './types/event.entity';
import { SeriesInput } from './types/series.entity';

const TEAM = 'team-1';
const TUESDAY = 2;
const THURSDAY = 4;

const input = (overrides: Partial<SeriesInput> = {}): SeriesInput => ({
  title: 'Treino',
  weekdays: [TUESDAY, THURSDAY],
  startTime: '21:00',
  durationMinutes: 90,
  startDate: '2026-11-02',
  endDate: '2026-11-29',
  ...overrides,
});

const lisbonHour = (date: Date) => DateTime.fromJSDate(date, { zone: 'Europe/Lisbon' }).hour;

describe('SeriesService', () => {
  let service: SeriesService;
  let repository: jest.Mocked<SeriesRepository>;

  beforeEach(() => {
    repository = { createWithEvents: jest.fn() } as jest.Mocked<SeriesRepository>;
    repository.createWithEvents.mockImplementation(
      async (series, events) =>
        events.map((event, index) => ({
          ...event,
          id: `event-${index}`,
          status: 'SCHEDULED',
          matchId: null,
          seriesId: 'series-1',
        })) as EventEntity[],
    );
    service = new SeriesService(repository);
  });

  const createdEvents = () => repository.createWithEvents.mock.calls[0][1];

  it('materialises Tuesday and Thursday for four weeks as 8 trainings at 21:00 Lisbon', async () => {
    const result = await service.create(TEAM, input());

    expect(result).toHaveLength(8);
    expect(repository.createWithEvents).toHaveBeenCalledTimes(1);
    for (const event of createdEvents()) {
      expect(event.type).toBe('TRAINING');
      expect(event.teamId).toBe(TEAM);
      expect(event.title).toBe('Treino');
      expect(lisbonHour(event.startsAt)).toBe(21);
      expect(event.endsAt!.getTime() - event.startsAt.getTime()).toBe(90 * 60 * 1000);
    }
    expect(createdEvents()[0].startsAt.toISOString()).toBe('2026-11-03T21:00:00.000Z');
    expect(createdEvents()[7].startsAt.toISOString()).toBe('2026-11-26T21:00:00.000Z');
  });

  it('persists the series row with the parsed input', async () => {
    await service.create(TEAM, input({ location: 'Campo' }));

    const [series, events] = repository.createWithEvents.mock.calls[0];
    expect(series).toEqual({
      teamId: TEAM,
      title: 'Treino',
      location: 'Campo',
      weekdays: [TUESDAY, THURSDAY],
      startTime: '21:00',
      durationMinutes: 90,
      startDate: new Date('2026-11-02T00:00:00Z'),
      endDate: new Date('2026-11-29T00:00:00Z'),
    });
    expect(events[0].location).toBe('Campo');
  });

  it('keeps 21:00 Lisbon across the March DST change (UTC hour goes 21 to 20)', async () => {
    // Sunday 2026-03-29 is the clock change; Thursday the 26th is winter, Tuesday the 31st summer.
    await service.create(TEAM, input({ startDate: '2026-03-26', endDate: '2026-03-31' }));

    const [winter, summer] = createdEvents();
    expect(winter.startsAt.getUTCHours()).toBe(21);
    expect(summer.startsAt.getUTCHours()).toBe(20);
    expect(lisbonHour(winter.startsAt)).toBe(21);
    expect(lisbonHour(summer.startsAt)).toBe(21);
  });

  it('keeps 21:00 Lisbon across the October DST change (UTC hour goes 20 to 21)', async () => {
    // Sunday 2026-10-25 is the clock change; Thursday the 22nd is summer, Tuesday the 27th winter.
    await service.create(TEAM, input({ startDate: '2026-10-22', endDate: '2026-10-27' }));

    const [summer, winter] = createdEvents();
    expect(summer.startsAt.getUTCHours()).toBe(20);
    expect(winter.startsAt.getUTCHours()).toBe(21);
    expect(lisbonHour(summer.startsAt)).toBe(21);
    expect(lisbonHour(winter.startsAt)).toBe(21);
  });

  it('includes both the start and the end date', async () => {
    await service.create(
      TEAM,
      input({ weekdays: [TUESDAY], startDate: '2026-11-03', endDate: '2026-11-03' }),
    );

    expect(createdEvents()).toHaveLength(1);
  });

  it('accepts up to 366 occurrences (a leap year of daily trainings)', async () => {
    await service.create(
      TEAM,
      input({ weekdays: [1, 2, 3, 4, 5, 6, 7], startDate: '2026-01-01', endDate: '2026-12-31' }),
    );

    expect(createdEvents()).toHaveLength(365);
    await service.create(
      TEAM,
      input({ weekdays: [1, 2, 3, 4, 5, 6, 7], startDate: '2028-01-01', endDate: '2028-12-31' }),
    );
    expect(repository.createWithEvents.mock.calls[1][1]).toHaveLength(366);
  });

  const invalidCases: Array<[string, Partial<SeriesInput>]> = [
    ['endDate before startDate', { startDate: '2026-11-10', endDate: '2026-11-09' }],
    [
      'more than 366 occurrences',
      { weekdays: [1, 2, 3, 4, 5, 6, 7], startDate: '2026-01-01', endDate: '2027-02-01' },
    ],
    ['a huge range', { startDate: '2020-01-01', endDate: '2099-12-31' }],
    ['no weekdays', { weekdays: [] }],
    ['weekday 0', { weekdays: [0] }],
    ['weekday 8', { weekdays: [8] }],
    ['a non-integer weekday', { weekdays: [1.5] }],
    ['a bad startTime', { startTime: '25:00' }],
    ['a startTime without leading zero', { startTime: '9:00' }],
    ['zero duration', { durationMinutes: 0 }],
    ['duration over 720', { durationMinutes: 721 }],
    ['a non-integer duration', { durationMinutes: 30.5 }],
    ['an impossible startDate', { startDate: '2026-02-30' }],
    ['a malformed endDate', { endDate: 'tomorrow' }],
    [
      'a range with no matching weekday',
      { weekdays: [1], startDate: '2026-11-03', endDate: '2026-11-05' },
    ],
  ];

  it.each(invalidCases)('rejects %s with SERIES_INVALID', async (_name, overrides) => {
    const promise = service.create(TEAM, input(overrides));

    await expect(promise).rejects.toBeInstanceOf(SeriesInvalidException);
    await expect(promise).rejects.toMatchObject({ code: 'SERIES_INVALID' });
    expect(repository.createWithEvents).not.toHaveBeenCalled();
  });
});
