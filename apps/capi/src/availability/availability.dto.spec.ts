import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RespondDto } from './types/availability.dto';

const errorsFor = async (plain: object) =>
  (await validate(plainToInstance(RespondDto, plain))).map((error) => error.property);

describe('RespondDto', () => {
  it('accepts every answer with or without a note', async () => {
    expect(await errorsFor({ answer: 'YES' })).toEqual([]);
    expect(await errorsFor({ answer: 'MAYBE', note: 'talvez' })).toEqual([]);
    expect(await errorsFor({ answer: 'NO', note: 'x'.repeat(140) })).toEqual([]);
  });

  it('rejects an unknown answer', async () => {
    expect(await errorsFor({ answer: 'SIM' })).toContain('answer');
    expect(await errorsFor({})).toContain('answer');
  });

  it('rejects a note longer than 140 characters', async () => {
    expect(await errorsFor({ answer: 'YES', note: 'x'.repeat(141) })).toContain('note');
  });
});
