import { ServiceUnavailableException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  const queryRaw = jest.fn();
  const controller = new HealthController({ $queryRaw: queryRaw } as unknown as PrismaService);

  beforeEach(() => queryRaw.mockReset());

  it('returns ok when SELECT 1 succeeds', async () => {
    queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toEqual({ status: 'ok' });
  });

  it('throws 503 without details when the database check fails', async () => {
    queryRaw.mockRejectedValue(new Error('connect ECONNREFUSED 10.0.0.5:5432 password=hunter2'));

    const error = await controller.check().catch((e) => e);

    expect(error).toBeInstanceOf(ServiceUnavailableException);
    expect(error.getStatus()).toBe(503);
    expect(error.getResponse()).toEqual({ status: 'error' });
  });
});
