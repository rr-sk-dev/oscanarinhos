import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthController } from './auth.controller';

const proto = AuthController.prototype;
const limitOf = (handler: object) => Reflect.getMetadata('THROTTLER:LIMIT' + 'default', handler);
const ttlOf = (handler: object) => Reflect.getMetadata('THROTTLER:TTL' + 'default', handler);

describe('AuthController throttling', () => {
  it.each([
    ['requestCode', 5],
    ['verify', 10],
  ] as const)('limits %s per IP to %i requests a minute', (method, limit) => {
    expect(Reflect.getMetadata('__guards__', proto[method])).toEqual([ThrottlerGuard]);
    expect(limitOf(proto[method])).toBe(limit);
    expect(ttlOf(proto[method])).toBe(60_000);
  });
});
