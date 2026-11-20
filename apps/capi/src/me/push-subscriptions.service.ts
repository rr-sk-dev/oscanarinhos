import { Injectable } from '@nestjs/common';
import { PushSubscriptionRepository } from '../push/push-subscription.repository';
import { RegisterPushSubscriptionDto } from './types/me.dto';

const MAX_USER_AGENT_LENGTH = 256;

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
      userAgent: userAgent === null ? null : userAgent.slice(0, MAX_USER_AGENT_LENGTH),
    });
  }

  async unregister(userId: string, endpoint: string): Promise<void> {
    await this.pushSubscriptionRepository.deleteByEndpointForUser(userId, endpoint);
  }
}
