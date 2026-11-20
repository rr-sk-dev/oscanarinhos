import { ConfigService } from '@nestjs/config';
import {
  EVENT_CANCELLED,
  EVENT_RESCHEDULED,
  EventChangedPayload,
} from '../events/types/event-change.events';
import { EventChangeListener } from './event-change.listener';
import { NotificationDeliveryService } from './notification-delivery.service';
import { RecipientResolver } from './recipient-resolver.service';

const payload: EventChangedPayload = {
  teamId: 'team-1',
  eventId: 'event-1',
  title: 'Treino',
  location: null,
  previousStartsAt: new Date('2030-01-10T19:00:00Z'),
  startsAt: new Date('2030-01-11T19:00:00Z'),
  actorUserId: 'actor-1',
};

const recipients = [
  { userId: 'u1', email: 'u1@example.com' },
  { userId: 'u2', email: 'u2@example.com' },
  { userId: 'u3', email: 'u3@example.com' },
];

describe('EventChangeListener', () => {
  let resolver: jest.Mocked<Pick<RecipientResolver, 'resolve'>>;
  let delivery: jest.Mocked<Pick<NotificationDeliveryService, 'deliver'>>;
  let frontendUrl: string | undefined;
  let listener: EventChangeListener;

  beforeEach(() => {
    frontendUrl = 'https://app.example.com';
    resolver = { resolve: jest.fn().mockResolvedValue(recipients) };
    delivery = { deliver: jest.fn().mockResolvedValue('push') };
    const config = { get: jest.fn(() => frontendUrl) };
    listener = new EventChangeListener(
      resolver as unknown as RecipientResolver,
      delivery as unknown as NotificationDeliveryService,
      config as unknown as ConfigService,
    );
  });

  it('resolves recipients for the payload team, event and actor', async () => {
    await listener.handleCancelled(payload);

    expect(resolver.resolve).toHaveBeenCalledWith('team-1', 'event-1', 'actor-1');
  });

  it('delivers a cancelled message to each recipient', async () => {
    await listener.handleCancelled(payload);

    expect(delivery.deliver).toHaveBeenCalledTimes(3);
    expect(delivery.deliver).toHaveBeenCalledWith(
      recipients[0],
      expect.objectContaining({ title: 'Treino cancelado' }),
      'https://app.example.com/members/events/event-1',
    );
  });

  it('delivers a rescheduled message for the rescheduled event', async () => {
    await listener.handleRescheduled(payload);

    expect(delivery.deliver).toHaveBeenCalledWith(
      recipients[1],
      expect.objectContaining({ title: 'Treino adiado' }),
      'https://app.example.com/members/events/event-1',
    );
  });

  it('falls back to localhost when FRONTEND_URL is unset', async () => {
    frontendUrl = undefined;

    await listener.handleCancelled(payload);

    expect(delivery.deliver).toHaveBeenCalledWith(
      recipients[0],
      expect.anything(),
      'http://localhost:4200/members/events/event-1',
    );
  });

  it('keeps delivering when one recipient throws', async () => {
    delivery.deliver.mockRejectedValueOnce(new Error('boom'));

    await expect(listener.handleCancelled(payload)).resolves.toBeUndefined();

    expect(delivery.deliver).toHaveBeenCalledTimes(3);
  });

  it('does not propagate a resolver failure', async () => {
    resolver.resolve.mockRejectedValue(new Error('db down'));

    await expect(listener.handleRescheduled(payload)).resolves.toBeUndefined();

    expect(delivery.deliver).not.toHaveBeenCalled();
  });

  it.each([
    ['handleCancelled', EVENT_CANCELLED],
    ['handleRescheduled', EVENT_RESCHEDULED],
  ] as const)('%s subscribes to %s asynchronously', (method, eventName) => {
    const metadata = Reflect.getMetadata(
      'EVENT_LISTENER_METADATA',
      EventChangeListener.prototype[method],
    ) as {
      event: string;
      options: { async?: boolean };
    }[];

    expect(metadata).toEqual([expect.objectContaining({ event: eventName })]);
    expect(metadata[0].options.async).toBe(true);
  });
});
