import { Injectable } from '@nestjs/common';
import { PushSubscriptionRepository } from '../push/push-subscription.repository';
import { RegisterPushSubscriptionDto } from './types/me.dto';

const MAX_USER_AGENT_LENGTH = 256;
export const MAX_SUBSCRIPTIONS_PER_USER = 10;

@Injectable()
export class PushSubscriptionsService {
  constructor(private readonly pushSubscriptionRepository: PushSubscriptionRepository) {}

  async register(
    userId: string,
    dto: RegisterPushSubscriptionDto,
    userAgent: string | null,
  ): Promise<void> {
    await this.makeRoomFor(userId, dto.endpoint);
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

  // Decided before the upsert: an endpoint moving to this user keeps its old createdAt, so
  // trimming afterwards could evict the device that was just registered.
  private async makeRoomFor(userId: string, endpoint: string): Promise<void> {
    const existing = await this.pushSubscriptionRepository.findByUserId(userId);
    const isNewEndpoint = !existing.some((subscription) => subscription.endpoint === endpoint);
    const excess = existing.length - MAX_SUBSCRIPTIONS_PER_USER + 1;
    if (isNewEndpoint && excess > 0) {
      await this.pushSubscriptionRepository.deleteOldestByUserId(userId, excess);
    }
  }
}
