import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitter2, EventEmitterModule } from '@nestjs/event-emitter';
import { Test, TestingModule } from '@nestjs/testing';
import { EmailSender } from '../auth/email/email-sender';
import { AvailabilityRepository } from '../availability/availability.repository';
import { PrismaService } from '../database/prisma.service';
import { EVENT_CANCELLED, EventChangedPayload } from '../events/types/event-change.events';
import { MembershipRepository } from '../members/membership.repository';
import { PushSender } from '../push/push-sender';
import { PushSubscriptionRepository } from '../push/push-subscription.repository';
import { UserRepository } from '../users/user.repository';
import { EventChangeListener } from './event-change.listener';
import { NotificationsModule } from './notifications.module';

// Stands in for DatabaseModule.forRoot(): the feature model providers resolve against it, and
// every repository that would use a model is overridden below. No database, no network.
@Global()
@Module({
  providers: [{ provide: PrismaService, useValue: {} }],
  exports: [PrismaService],
})
class FakeDatabaseModule {}

const payload: EventChangedPayload = {
  teamId: 'team-1',
  eventId: 'event-1',
  title: 'Treino',
  location: null,
  previousStartsAt: new Date('2030-01-10T19:00:00Z'),
  startsAt: new Date('2030-01-10T19:00:00Z'),
  actorUserId: 'actor-1',
};

describe('NotificationsModule wiring', () => {
  let moduleRef: TestingModule;
  let emailSend: jest.Mock;
  let emailSent: Promise<void>;
  let pushSend: jest.Mock;

  beforeEach(async () => {
    let markSent: () => void = () => undefined;
    emailSent = new Promise((resolve) => (markSent = resolve));
    emailSend = jest.fn(() => {
      markSent();
      return Promise.resolve();
    });
    pushSend = jest.fn();

    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        EventEmitterModule.forRoot(),
        FakeDatabaseModule,
        NotificationsModule,
      ],
    })
      .overrideProvider(MembershipRepository)
      .useValue({
        findByTeam: jest.fn().mockResolvedValue([
          { id: 'm-actor', userId: 'actor-1' },
          { id: 'm-1', userId: 'user-1' },
        ]),
      })
      .overrideProvider(AvailabilityRepository)
      .useValue({ findByEvent: jest.fn().mockResolvedValue([]) })
      .overrideProvider(UserRepository)
      .useValue({
        findById: jest.fn((id: string) => Promise.resolve({ id, email: `${id}@example.com` })),
      })
      .overrideProvider(PushSubscriptionRepository)
      .useValue({ findByUserId: jest.fn().mockResolvedValue([]) })
      .overrideProvider(PushSender)
      .useValue({ isEnabled: true, send: pushSend })
      .overrideProvider(EmailSender)
      .useValue({ send: emailSend })
      .compile();
    // @OnEvent handlers are only subscribed during application bootstrap.
    await moduleRef.init();
  });

  afterEach(async () => {
    await moduleRef.close();
  });

  it('compiles and resolves the listener', () => {
    expect(moduleRef.get(EventChangeListener)).toBeInstanceOf(EventChangeListener);
  });

  it('emails a recipient without push subscriptions when an event is cancelled', async () => {
    await moduleRef.get(EventEmitter2).emitAsync(EVENT_CANCELLED, payload);
    await emailSent;

    expect(emailSend).toHaveBeenCalledTimes(1);
    expect(emailSend).toHaveBeenCalledWith(
      'user-1@example.com',
      expect.any(String),
      expect.stringContaining('/members/events/event-1'),
    );
    expect(pushSend).not.toHaveBeenCalled();
  });
});
