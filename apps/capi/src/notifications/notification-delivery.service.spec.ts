import { EmailSender } from '../auth/email/email-sender';
import { PushResult, PushSender } from '../push/push-sender';
import { PushSubscriptionEntity } from '../push/push-subscription.entity';
import { PushSubscriptionRepository } from '../push/push-subscription.repository';
import { EmailPacer } from './email-pacer';
import { NotificationDeliveryService } from './notification-delivery.service';

const recipient = { userId: 'user-1', email: 'user-1@example.com' };
const message = { title: 'Treino cancelado', body: 'O treino foi cancelado.' };
const eventUrl = 'http://localhost:4200/members/events/event-1';

const subscription = (endpoint: string): PushSubscriptionEntity => ({
  id: `id-${endpoint}`,
  userId: 'user-1',
  endpoint,
  p256dh: 'key',
  auth: 'auth',
  userAgent: null,
});

describe('NotificationDeliveryService', () => {
  let subscriptions: jest.Mocked<
    Pick<PushSubscriptionRepository, 'findByUserId' | 'deleteByEndpoint'>
  >;
  let pushSender: { isEnabled: boolean; send: jest.Mock<Promise<PushResult>> };
  let emailSender: jest.Mocked<Pick<EmailSender, 'send'>>;
  let pacer: { schedule: jest.Mock };
  let service: NotificationDeliveryService;

  const givenResults = (results: Record<string, PushResult>): void => {
    subscriptions.findByUserId.mockResolvedValue(Object.keys(results).map(subscription));
    pushSender.send.mockImplementation((entity: PushSubscriptionEntity) =>
      Promise.resolve(results[entity.endpoint]),
    );
  };

  beforeEach(() => {
    subscriptions = { findByUserId: jest.fn(), deleteByEndpoint: jest.fn() };
    subscriptions.deleteByEndpoint.mockResolvedValue();
    subscriptions.findByUserId.mockResolvedValue([]);
    pushSender = { isEnabled: true, send: jest.fn() };
    emailSender = { send: jest.fn().mockResolvedValue(undefined) };
    pacer = { schedule: jest.fn((task: () => Promise<unknown>) => task()) };
    service = new NotificationDeliveryService(
      subscriptions as unknown as PushSubscriptionRepository,
      pushSender as unknown as PushSender,
      emailSender as unknown as EmailSender,
      pacer as unknown as EmailPacer,
    );
  });

  it('emails when the user has no subscriptions', async () => {
    await expect(service.deliver(recipient, message, eventUrl)).resolves.toBe('email');

    expect(pushSender.send).not.toHaveBeenCalled();
    expect(emailSender.send).toHaveBeenCalledTimes(1);
    expect(emailSender.send).toHaveBeenCalledWith(
      'user-1@example.com',
      message.title,
      `${message.body}\n\n${eventUrl}`,
    );
  });

  it('sends the email through the pacer', async () => {
    await service.deliver(recipient, message, eventUrl);

    expect(pacer.schedule).toHaveBeenCalledTimes(1);
    expect(emailSender.send).toHaveBeenCalledTimes(1);
  });

  it('never goes through the pacer for a push-only delivery', async () => {
    givenResults({ a: 'sent' });

    await service.deliver(recipient, message, eventUrl);

    expect(pacer.schedule).not.toHaveBeenCalled();
  });

  it('sends the push payload with the event url', async () => {
    givenResults({ a: 'sent' });

    await service.deliver(recipient, message, eventUrl);

    expect(pushSender.send).toHaveBeenCalledWith(expect.objectContaining({ endpoint: 'a' }), {
      title: message.title,
      body: message.body,
      url: eventUrl,
    });
  });

  it('returns push and sends no email when one send succeeds and another fails', async () => {
    givenResults({ a: 'sent', b: 'failed' });

    await expect(service.deliver(recipient, message, eventUrl)).resolves.toBe('push');

    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it('emails when every push send failed', async () => {
    givenResults({ a: 'failed', b: 'failed' });

    await expect(service.deliver(recipient, message, eventUrl)).resolves.toBe('email');

    expect(emailSender.send).toHaveBeenCalledTimes(1);
  });

  it('deletes a gone endpoint', async () => {
    givenResults({ a: 'gone', b: 'failed' });

    await service.deliver(recipient, message, eventUrl);

    expect(subscriptions.deleteByEndpoint).toHaveBeenCalledTimes(1);
    expect(subscriptions.deleteByEndpoint).toHaveBeenCalledWith('a');
  });

  it('returns push when one endpoint is gone and another sent', async () => {
    givenResults({ a: 'gone', b: 'sent' });

    await expect(service.deliver(recipient, message, eventUrl)).resolves.toBe('push');

    expect(subscriptions.deleteByEndpoint).toHaveBeenCalledWith('a');
    expect(emailSender.send).not.toHaveBeenCalled();
  });

  it('emails when the only endpoint is gone', async () => {
    givenResults({ a: 'gone' });

    await expect(service.deliver(recipient, message, eventUrl)).resolves.toBe('email');
  });

  it('returns none and does not throw when the email sender throws', async () => {
    emailSender.send.mockRejectedValue(new Error('smtp down'));

    await expect(service.deliver(recipient, message, eventUrl)).resolves.toBe('none');
  });

  it('ignores stored subscriptions and emails when push is disabled', async () => {
    pushSender.isEnabled = false;
    givenResults({ a: 'sent' });

    await expect(service.deliver(recipient, message, eventUrl)).resolves.toBe('email');

    expect(subscriptions.findByUserId).not.toHaveBeenCalled();
    expect(pushSender.send).not.toHaveBeenCalled();
    expect(emailSender.send).toHaveBeenCalledTimes(1);
  });
});
