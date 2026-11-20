import * as webpush from 'web-push';
import { PushSubscriptionEntity } from './push-subscription.entity';
import { WebPushSender } from './web-push-sender';

jest.mock('web-push', () => ({ sendNotification: jest.fn() }));

const sendNotification = webpush.sendNotification as jest.Mock;

const subscription: PushSubscriptionEntity = {
  id: 'sub-1',
  userId: 'user-1',
  endpoint: 'https://push.example.com/abc',
  p256dh: 'p256dh-key',
  auth: 'auth-secret',
  userAgent: null,
};
const payload = { title: 'Jogo cancelado', body: 'Treino de terça', url: '/events/1' };

describe('WebPushSender', () => {
  let sender: WebPushSender;

  beforeEach(() => {
    sendNotification.mockReset();
    sender = new WebPushSender('public', 'private', 'mailto:admin@example.com');
  });

  it('is enabled', () => {
    expect(sender.isEnabled).toBe(true);
  });

  it('returns sent on success', async () => {
    sendNotification.mockResolvedValue({ statusCode: 201 });

    await expect(sender.send(subscription, payload)).resolves.toBe('sent');
  });

  it.each([404, 410])('returns gone for HTTP %i', async (statusCode) => {
    sendNotification.mockRejectedValue({ statusCode });

    await expect(sender.send(subscription, payload)).resolves.toBe('gone');
  });

  it('returns failed for HTTP 500', async () => {
    sendNotification.mockRejectedValue({ statusCode: 500 });

    await expect(sender.send(subscription, payload)).resolves.toBe('failed');
  });

  it('returns failed for a network error', async () => {
    sendNotification.mockRejectedValue(new Error('ECONNRESET'));

    await expect(sender.send(subscription, payload)).resolves.toBe('failed');
  });

  it('sends the Angular service worker payload with VAPID details and a timeout', async () => {
    sendNotification.mockResolvedValue({ statusCode: 201 });

    await sender.send(subscription, payload);

    expect(sendNotification).toHaveBeenCalledWith(
      { endpoint: subscription.endpoint, keys: { p256dh: 'p256dh-key', auth: 'auth-secret' } },
      JSON.stringify({
        notification: {
          title: payload.title,
          body: payload.body,
          data: {
            onActionClick: {
              default: { operation: 'navigateLastFocusedOrOpen', url: payload.url },
            },
          },
        },
      }),
      {
        vapidDetails: {
          subject: 'mailto:admin@example.com',
          publicKey: 'public',
          privateKey: 'private',
        },
        timeout: 10_000,
      },
    );
  });
});
