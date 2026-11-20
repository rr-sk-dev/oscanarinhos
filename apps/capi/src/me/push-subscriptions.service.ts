import { Injectable } from '@nestjs/common';
import { PushSubscriptionRepository } from '../push/push-subscription.repository';
import { RegisterPushSubscriptionDto } from './types/me.dto';

@Injectable()
export class PushSubscriptionsService {
  constructor(private readonly pushSubscriptionRepository: PushSubscriptionRepository) {}

  async register(
    userId: string,
    dto: RegisterPushSubscriptionDto,
    userAgent: string | null,
  ): Promise<void> {
    await this.pushSubscriptionRepository.upsertByEndpoint({
      userId,
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      userAgent,
    });
  }

  async unregister(userId: string, endpoint: string): Promise<void> {
    await this.pushSubscriptionRepository.deleteByEndpointForUser(userId, endpoint);
  }
}
