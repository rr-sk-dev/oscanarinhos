import { PushSubscriptionEntity, UpsertPushSubscriptionData } from './push-subscription.entity';

export abstract class PushSubscriptionRepository {
  /** Insert or update on endpoint; an existing endpoint changes owner and keys. */
  abstract upsertByEndpoint(data: UpsertPushSubscriptionData): Promise<PushSubscriptionEntity>;
  abstract findByUserId(userId: string): Promise<PushSubscriptionEntity[]>;
  /** No error when the endpoint is absent. */
  abstract deleteByEndpoint(endpoint: string): Promise<void>;
  /** No error when the endpoint is absent or belongs to another user. */
  abstract deleteByEndpointForUser(userId: string, endpoint: string): Promise<void>;
  /** Deletes the user's `count` oldest subscriptions (by creation time). */
  abstract deleteOldestByUserId(userId: string, count: number): Promise<void>;
}
