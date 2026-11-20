import { PushSubscriptionEntity } from './push-subscription.entity';

export interface PushPayload {
  title: string;
  body: string;
  url: string;
}

/** `gone` means the subscription no longer exists (HTTP 404 or 410) and should be removed. */
export type PushResult = 'sent' | 'gone' | 'failed';

export abstract class PushSender {
  abstract readonly isEnabled: boolean;

  abstract send(subscription: PushSubscriptionEntity, payload: PushPayload): Promise<PushResult>;
}
