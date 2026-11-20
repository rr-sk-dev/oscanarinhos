import { ValidationPipe } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateEventDto, UpdateEventDto, updateEventValidationPipe } from './types/event.dto';

const errorsFor = async (cls: new () => object, plain: object) =>
  (await validate(plainToInstance(cls, plain))).map((error) => error.property);

describe('UpdateEventDto', () => {
  it.each(['title', 'startsAt', 'status'])('rejects null for non-nullable %s', async (field) => {
    expect(await errorsFor(UpdateEventDto, { [field]: null })).toContain(field);
  });

  it.each(['endsAt', 'location', 'notes', 'respondBy'])('accepts null for %s', async (field) => {
    expect(await errorsFor(UpdateEventDto, { [field]: null })).toEqual([]);
  });

  it('accepts an empty patch', async () => {
    expect(await errorsFor(UpdateEventDto, {})).toEqual([]);
  });

  it('accepts a boolean notifyTeam and rejects anything else', async () => {
    expect(await errorsFor(UpdateEventDto, { notifyTeam: true })).toEqual([]);
    expect(await errorsFor(UpdateEventDto, { notifyTeam: 'yes' })).toContain('notifyTeam');
  });

  it.each(['startsAt', 'endsAt', 'respondBy'])('rejects impossible date for %s', async (field) => {
    expect(await errorsFor(UpdateEventDto, { [field]: '2026-02-30T10:00:00Z' })).toContain(field);
  });

  describe('update validation pipe', () => {
    const run = (body: object) =>
      updateEventValidationPipe.transform(body, {
        type: 'custom',
        metatype: UpdateEventDto,
      });

    it.each([{ type: 'TRAINING' }, { teamId: 'other-team' }, { matchId: 'm' }, { seriesId: 's' }])(
      'rejects unlisted key %o with 400',
      async (body) => {
        await expect(run(body)).rejects.toMatchObject({ status: 400 });
      },
    );

    it('accepts listed keys', async () => {
      await expect(run({ title: 'x' })).resolves.toBeInstanceOf(UpdateEventDto);
    });

    it('is a ValidationPipe', () => {
      expect(updateEventValidationPipe).toBeInstanceOf(ValidationPipe);
    });
  });
});

describe('CreateEventDto', () => {
  const base = { type: 'TRAINING', title: 'T', startsAt: '2026-12-01T19:00:00Z' };

  it.each(['startsAt', 'endsAt', 'respondBy'])('rejects impossible date for %s', async (field) => {
    expect(await errorsFor(CreateEventDto, { ...base, [field]: '2026-02-30T10:00:00Z' })).toContain(
      field,
    );
  });
});
