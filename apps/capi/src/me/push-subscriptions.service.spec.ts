import { PushSubscriptionRepository } from '../push/push-subscription.repository';
import { PushSubscriptionsService } from './push-subscriptions.service';

describe('PushSubscriptionsService', () => {
  let repository: jest.Mocked<PushSubscriptionRepository>;
  let service: PushSubscriptionsService;

  beforeEach(() => {
    repository = {
      upsertByEndpoint: jest.fn(),
      deleteByEndpoint: jest.fn(),
      deleteByEndpointForUser: jest.fn(),
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

  it('unregisters only through the user-scoped delete', async () => {
    await service.unregister('u1', 'https://push.example/abc');

    expect(repository.deleteByEndpointForUser).toHaveBeenCalledWith(
      'u1',
      'https://push.example/abc',
    );
    expect(repository.deleteByEndpoint).not.toHaveBeenCalled();
  });
});
