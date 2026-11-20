import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaPushSubscriptionRepository } from './push-subscription-prisma.repository';
import { PushSubscriptionRepository } from './push-subscription.repository';

@Module({
  imports: [DatabaseModule.forFeature('pushSubscription')],
  providers: [{ provide: PushSubscriptionRepository, useClass: PrismaPushSubscriptionRepository }],
  exports: [PushSubscriptionRepository],
})
export class PushModule {}
