import { PushSubscriptionEntity } from '../push/push-subscription.entity';
import { PushSubscriptionRepository } from '../push/push-subscription.repository';
import { PushSubscriptionsService } from './push-subscriptions.service';

const stored = (count: number): PushSubscriptionEntity[] =>
  Array.from({ length: count }, (_, index) => ({
    id: `sub-${index}`,
    userId: 'u1',
    endpoint: `https://push.example/${index}`,
    p256dh: 'key',
    auth: 'secret',
    userAgent: null,
  }));

describe('PushSubscriptionsService', () => {
  let repository: jest.Mocked<PushSubscriptionRepository>;
  let service: PushSubscriptionsService;

  beforeEach(() => {
    repository = {
      upsertByEndpoint: jest.fn(),
      findByUserId: jest.fn().mockResolvedValue([]),
      deleteByEndpoint: jest.fn(),
      deleteByEndpointForUser: jest.fn(),
      deleteOldestByUserId: jest.fn(),
    } as unknown as jest.Mocked<PushSubscriptionRepository>;
    service = new PushSubscriptionsService(repository);
  });

  it('registers the device for the user with the user agent', async () => {
    await service.register(
      'u1',
      { endpoint: 'https://push.example/abc', keys: { p256dh: 'key', auth: 'secret' } },
      'Mozilla/5.0',
    );

    expect(repository.upsertByEndpoint).toHaveBeenCalledWith({
      userId: 'u1',
      endpoint: 'https://push.example/abc',
      p256dh: 'key',
      auth: 'secret',
      userAgent: 'Mozilla/5.0',
    });
  });

  it('registers without a user agent', async () => {
    await service.register(
      'u1',
      { endpoint: 'https://push.example/abc', keys: { p256dh: 'key', auth: 'secret' } },
      null,
    );

    expect(repository.upsertByEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ userAgent: null }),
    );
  });

  it('stores a user agent longer than 256 characters truncated to 256', async () => {
    await service.register(
      'u1',
      { endpoint: 'https://push.example/abc', keys: { p256dh: 'key', auth: 'secret' } },
      'x'.repeat(300),
    );

    expect(repository.upsertByEndpoint).toHaveBeenCalledWith(
      expect.objectContaining({ userAgent: 'x'.repeat(256) }),
    );
  });

  describe('per-user cap of 10 subscriptions', () => {
    const keys = { p256dh: 'key', auth: 'secret' };

    it('evicts the oldest before storing an 11th endpoint', async () => {
      repository.findByUserId.mockResolvedValue(stored(10));

      await service.register('u1', { endpoint: 'https://push.example/new', keys }, null);

      expect(repository.findByUserId).toHaveBeenCalledWith('u1');
      expect(repository.deleteOldestByUserId).toHaveBeenCalledWith('u1', 1);
      expect(repository.upsertByEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: 'https://push.example/new' }),
      );
      expect(repository.deleteOldestByUserId.mock.invocationCallOrder[0]).toBeLessThan(
        repository.upsertByEndpoint.mock.invocationCallOrder[0],
      );
    });

    it('evicts nothing when re-registering an endpoint the user already has', async () => {
      repository.findByUserId.mockResolvedValue(stored(10));

      await service.register('u1', { endpoint: 'https://push.example/3', keys }, null);

      expect(repository.deleteOldestByUserId).not.toHaveBeenCalled();
      expect(repository.upsertByEndpoint).toHaveBeenCalledWith(
        expect.objectContaining({ endpoint: 'https://push.example/3' }),
      );
    });

    it('evicts nothing below the cap', async () => {
      repository.findByUserId.mockResolvedValue(stored(9));

      await service.register('u1', { endpoint: 'https://push.example/new', keys }, null);

      expect(repository.deleteOldestByUserId).not.toHaveBeenCalled();
    });

    it('trims back to the cap when the user somehow has more than 10', async () => {
      repository.findByUserId.mockResolvedValue(stored(12));

      await service.register('u1', { endpoint: 'https://push.example/new', keys }, null);

      expect(repository.deleteOldestByUserId).toHaveBeenCalledWith('u1', 3);
    });
  });

  it('unregisters only through the user-scoped delete', async () => {
    await service.unregister('u1', 'https://push.example/abc');

    expect(repository.deleteByEndpointForUser).toHaveBeenCalledWith(
      'u1',
      'https://push.example/abc',
    );
    expect(repository.deleteByEndpoint).not.toHaveBeenCalled();
  });
});
