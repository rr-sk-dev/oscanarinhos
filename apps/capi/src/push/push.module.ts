import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database';
import { DisabledPushSender } from './disabled-push-sender';
import { PushSender } from './push-sender';
import { PrismaPushSubscriptionRepository } from './push-subscription-prisma.repository';
import { PushSubscriptionRepository } from './push-subscription.repository';
import { WebPushSender } from './web-push-sender';

@Module({
  imports: [DatabaseModule.forFeature('pushSubscription')],
  providers: [
    { provide: PushSubscriptionRepository, useClass: PrismaPushSubscriptionRepository },
    {
      provide: PushSender,
      inject: [ConfigService],
      useFactory: (configService: ConfigService): PushSender => {
        const publicKey = configService.get<string>('VAPID_PUBLIC_KEY');
        const privateKey = configService.get<string>('VAPID_PRIVATE_KEY');
        const subject = configService.get<string>('VAPID_SUBJECT');
        if (!publicKey || !privateKey || !subject) {
          return new DisabledPushSender();
        }
        return new WebPushSender(publicKey, privateKey, subject);
      },
    },
  ],
  exports: [PushSubscriptionRepository, PushSender],
})
export class PushModule {}
