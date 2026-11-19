import { ConfigService } from '@nestjs/config';
import { sign } from 'jsonwebtoken';
import { JwtStrategy } from './jwt.strategy';

const SECRET = 'a'.repeat(32);

type Outcome = 'success' | 'fail';

function authenticate(token: string): Promise<Outcome> {
  const strategy = new JwtStrategy({ getOrThrow: () => SECRET } as unknown as ConfigService);
  return new Promise((resolve) => {
    Object.assign(strategy, {
      success: () => resolve('success'),
      fail: () => resolve('fail'),
      error: () => resolve('fail'),
    });
    strategy.authenticate({ headers: { authorization: `Bearer ${token}` } } as never);
  });
}

describe('JwtStrategy', () => {
  it('accepts an HS256 token', async () => {
    await expect(authenticate(sign({ sub: 'u1' }, SECRET, { algorithm: 'HS256' }))).resolves.toBe(
      'success',
    );
  });

  it('rejects a token signed with another algorithm', async () => {
    await expect(authenticate(sign({ sub: 'u1' }, SECRET, { algorithm: 'HS512' }))).resolves.toBe(
      'fail',
    );
  });
});
