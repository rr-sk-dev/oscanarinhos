import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DatabaseModule } from '../database';
import { createPushSender } from './create-push-sender';
import { PushSender } from './push-sender';
import { PrismaPushSubscriptionRepository } from './push-subscription-prisma.repository';
import { PushSubscriptionRepository } from './push-subscription.repository';

@Module({
  imports: [DatabaseModule.forFeature('pushSubscription')],
  providers: [
    { provide: PushSubscriptionRepository, useClass: PrismaPushSubscriptionRepository },
    {
      provide: PushSender,
      inject: [ConfigService],
      useFactory: createPushSender,
    },
  ],
  exports: [PushSubscriptionRepository, PushSender],
})
export class PushModule {}
