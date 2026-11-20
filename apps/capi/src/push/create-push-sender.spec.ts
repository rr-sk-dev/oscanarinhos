import { ConfigService } from '@nestjs/config';
import * as webpush from 'web-push';
import { createPushSender } from './create-push-sender';
import { DisabledPushSender } from './disabled-push-sender';
import { WebPushSender } from './web-push-sender';

function configWith(values: Record<string, string | undefined>): ConfigService {
  return { get: jest.fn((key: string) => values[key]) } as unknown as ConfigService;
}

describe('createPushSender', () => {
  const keys = webpush.generateVAPIDKeys();
  const valid = {
    VAPID_PUBLIC_KEY: keys.publicKey,
    VAPID_PRIVATE_KEY: keys.privateKey,
    VAPID_SUBJECT: 'mailto:admin@example.com',
  };

  it('builds a WebPushSender from a valid configuration', () => {
    const sender = createPushSender(configWith(valid));

    expect(sender).toBeInstanceOf(WebPushSender);
    expect(sender.isEnabled).toBe(true);
  });

  it('accepts an https subject', () => {
    expect(
      createPushSender(configWith({ ...valid, VAPID_SUBJECT: 'https://example.com' })),
    ).toBeInstanceOf(WebPushSender);
  });

  it('fails with a clear error for a mistyped private key', () => {
    expect(() =>
      createPushSender(configWith({ ...valid, VAPID_PRIVATE_KEY: valid.VAPID_PRIVATE_KEY + 'x' })),
    ).toThrow(/Invalid VAPID configuration.*private key/i);
  });

  it('fails with a clear error for a mistyped public key', () => {
    expect(() => createPushSender(configWith({ ...valid, VAPID_PUBLIC_KEY: 'not-a-key' }))).toThrow(
      /Invalid VAPID configuration.*public key/i,
    );
  });

  it('fails with a clear error for a subject that is neither mailto: nor https:', () => {
    expect(() =>
      createPushSender(configWith({ ...valid, VAPID_SUBJECT: 'admin@example.com' })),
    ).toThrow(/Invalid VAPID configuration.*subject/i);
  });

  it('is disabled when no VAPID variable is set', () => {
    const sender = createPushSender(configWith({}));

    expect(sender).toBeInstanceOf(DisabledPushSender);
    expect(sender.isEnabled).toBe(false);
  });

  it.each(Object.keys(valid))('is disabled when %s is missing', (missing) => {
    expect(createPushSender(configWith({ ...valid, [missing]: undefined }))).toBeInstanceOf(
      DisabledPushSender,
    );
  });
});
