import { Injectable } from '@nestjs/common';
import { PushSubscription as PrismaPushSubscription } from '../../prisma/generated/prisma/client';
import { InjectModel, ModelDelegate } from '../database';
import { PushSubscriptionEntity, UpsertPushSubscriptionData } from './push-subscription.entity';
import { PushSubscriptionRepository } from './push-subscription.repository';

function toDomain(record: PrismaPushSubscription): PushSubscriptionEntity {
  return {
    id: record.id,
    userId: record.userId,
    endpoint: record.endpoint,
    p256dh: record.p256dh,
    auth: record.auth,
    userAgent: record.userAgent,
  };
}

@Injectable()
export class PrismaPushSubscriptionRepository extends PushSubscriptionRepository {
  constructor(
    @InjectModel('pushSubscription')
    private readonly pushSubscriptionModel: ModelDelegate<'pushSubscription'>,
  ) {
    super();
  }

  async upsertByEndpoint(data: UpsertPushSubscriptionData): Promise<PushSubscriptionEntity> {
    const { userId, endpoint, p256dh, auth, userAgent } = data;
    const record = await this.pushSubscriptionModel.upsert({
      where: { endpoint },
      create: { userId, endpoint, p256dh, auth, userAgent },
      update: { userId, p256dh, auth, userAgent },
    });
    return toDomain(record);
  }

  async findByUserId(userId: string): Promise<PushSubscriptionEntity[]> {
    const records = await this.pushSubscriptionModel.findMany({ where: { userId } });
    return records.map(toDomain);
  }

  async deleteByEndpoint(endpoint: string): Promise<void> {
    await this.pushSubscriptionModel.deleteMany({ where: { endpoint } });
  }

  async deleteByEndpointForUser(userId: string, endpoint: string): Promise<void> {
    await this.pushSubscriptionModel.deleteMany({ where: { userId, endpoint } });
  }
}
