import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSeriesDto } from './types/series.dto';

const valid = {
  title: 'Treino',
  weekdays: [2, 4],
  startTime: '21:00',
  durationMinutes: 90,
  startDate: '2026-11-02',
  endDate: '2026-11-29',
};

const errorsFor = async (plain: object) =>
  (await validate(plainToInstance(CreateSeriesDto, plain))).map((error) => error.property);

describe('CreateSeriesDto', () => {
  it('accepts a valid series', async () => {
    expect(await errorsFor(valid)).toEqual([]);
    expect(await errorsFor({ ...valid, location: 'Campo' })).toEqual([]);
  });

  it.each([
    ['title', ''],
    ['weekdays', []],
    ['weekdays', [0]],
    ['weekdays', [8]],
    ['weekdays', ['1']],
    ['startTime', '9:00'],
    ['startTime', '24:00'],
    ['durationMinutes', 0],
    ['durationMinutes', 721],
    ['startDate', '2026-11-02T10:00:00Z'],
    ['endDate', 'tomorrow'],
  ])('rejects %s = %j', async (field, value) => {
    expect(await errorsFor({ ...valid, [field]: value })).toContain(field);
  });
});
