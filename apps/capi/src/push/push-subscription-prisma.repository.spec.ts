import { PrismaPushSubscriptionRepository } from './push-subscription-prisma.repository';

const record = {
  id: 'sub-1',
  userId: 'user-1',
  endpoint: 'https://push.example/abc',
  p256dh: 'p256dh-key',
  auth: 'auth-key',
  userAgent: 'Mozilla/5.0',
  createdAt: new Date('2026-11-20T10:00:00Z'),
};

describe('PrismaPushSubscriptionRepository', () => {
  let model: { upsert: jest.Mock; findMany: jest.Mock; deleteMany: jest.Mock };
  let repository: PrismaPushSubscriptionRepository;

  beforeEach(() => {
    model = {
      upsert: jest.fn().mockResolvedValue(record),
      findMany: jest.fn().mockResolvedValue([record]),
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
    };
    repository = new PrismaPushSubscriptionRepository(model as never);
  });

  it('upserts keyed on endpoint and moves ownership and keys on update', async () => {
    const data = {
      userId: 'user-2',
      endpoint: record.endpoint,
      p256dh: 'new-p256dh',
      auth: 'new-auth',
      userAgent: null,
    };

    const result = await repository.upsertByEndpoint(data);

    expect(model.upsert).toHaveBeenCalledWith({
      where: { endpoint: record.endpoint },
      create: data,
      update: { userId: 'user-2', p256dh: 'new-p256dh', auth: 'new-auth', userAgent: null },
    });
    expect(result).toEqual({
      id: 'sub-1',
      userId: 'user-1',
      endpoint: record.endpoint,
      p256dh: 'p256dh-key',
      auth: 'auth-key',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('finds subscriptions by user', async () => {
    const result = await repository.findByUserId('user-1');

    expect(model.findMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } });
    expect(result).toHaveLength(1);
    expect(result[0].endpoint).toBe(record.endpoint);
  });

  it('deletes by endpoint without throwing when nothing matches', async () => {
    await expect(repository.deleteByEndpoint('gone')).resolves.toBeUndefined();

    expect(model.deleteMany).toHaveBeenCalledWith({ where: { endpoint: 'gone' } });
  });

  it('deletes by endpoint for a user without throwing when nothing matches', async () => {
    await expect(repository.deleteByEndpointForUser('user-1', 'gone')).resolves.toBeUndefined();

    expect(model.deleteMany).toHaveBeenCalledWith({
      where: { userId: 'user-1', endpoint: 'gone' },
    });
  });
});
