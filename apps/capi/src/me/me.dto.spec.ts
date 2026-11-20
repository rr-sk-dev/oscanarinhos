import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterPushSubscriptionDto, UnregisterPushSubscriptionDto } from './types/me.dto';

const errorsFor = async <T extends object>(type: new () => T, plain: object) =>
  (await validate(plainToInstance(type, plain))).map((error) => error.property);

describe('RegisterPushSubscriptionDto', () => {
  const valid = {
    endpoint: 'https://push.example/abc',
    keys: { p256dh: 'key', auth: 'secret' },
  };

  it('accepts a complete subscription', async () => {
    expect(await errorsFor(RegisterPushSubscriptionDto, valid)).toEqual([]);
  });

  it('rejects a non-URL endpoint', async () => {
    expect(await errorsFor(RegisterPushSubscriptionDto, { ...valid, endpoint: 'nope' })).toContain(
      'endpoint',
    );
  });

  it('rejects a missing keys.auth', async () => {
    const errors = await validate(
      plainToInstance(RegisterPushSubscriptionDto, {
        ...valid,
        keys: { p256dh: 'key' },
      }),
    );
    expect(errors.map((error) => error.property)).toContain('keys');
    expect(errors[0].children?.map((child) => child.property)).toContain('auth');
  });

  it('rejects an empty keys.auth', async () => {
    const errors = await validate(
      plainToInstance(RegisterPushSubscriptionDto, { ...valid, keys: { p256dh: 'key', auth: '' } }),
    );
    expect(errors[0].children?.map((child) => child.property)).toContain('auth');
  });

  it('rejects an over-long endpoint', async () => {
    const endpoint = `https://push.example/${'a'.repeat(2048)}`;
    expect(await errorsFor(RegisterPushSubscriptionDto, { ...valid, endpoint })).toContain(
      'endpoint',
    );
  });

  it('rejects over-long keys', async () => {
    for (const field of ['p256dh', 'auth']) {
      const errors = await validate(
        plainToInstance(RegisterPushSubscriptionDto, {
          ...valid,
          keys: { ...valid.keys, [field]: 'k'.repeat(257) },
        }),
      );
      expect(errors[0].children?.map((child) => child.property)).toContain(field);
    }
  });

  it('rejects missing keys', async () => {
    expect(await errorsFor(RegisterPushSubscriptionDto, { endpoint: valid.endpoint })).toContain(
      'keys',
    );
  });
});

describe('UnregisterPushSubscriptionDto', () => {
  it('requires an endpoint', async () => {
    expect(await errorsFor(UnregisterPushSubscriptionDto, {})).toContain('endpoint');
    expect(await errorsFor(UnregisterPushSubscriptionDto, { endpoint: 'x' })).toEqual([]);
  });

  it('rejects an over-long endpoint', async () => {
    expect(
      await errorsFor(UnregisterPushSubscriptionDto, { endpoint: 'e'.repeat(2049) }),
    ).toContain('endpoint');
  });
});
