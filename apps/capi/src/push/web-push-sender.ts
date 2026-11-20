import * as webpush from 'web-push';
import { PushPayload, PushResult, PushSender } from './push-sender';
import { PushSubscriptionEntity } from './push-subscription.entity';

const SEND_TIMEOUT_MS = 10_000;
const GONE_STATUS_CODES = [404, 410];

export class WebPushSender extends PushSender {
  readonly isEnabled = true;

  constructor(
    private readonly publicKey: string,
    private readonly privateKey: string,
    private readonly subject: string,
  ) {
    super();
  }

  async send(subscription: PushSubscriptionEntity, payload: PushPayload): Promise<PushResult> {
    try {
      await webpush.sendNotification(
        {
          endpoint: subscription.endpoint,
          keys: { p256dh: subscription.p256dh, auth: subscription.auth },
        },
        this.toServiceWorkerPayload(payload),
        {
          vapidDetails: {
            subject: this.subject,
            publicKey: this.publicKey,
            privateKey: this.privateKey,
          },
          timeout: SEND_TIMEOUT_MS,
        },
      );
      return 'sent';
    } catch (error) {
      return this.isGone(error) ? 'gone' : 'failed';
    }
  }

  // The Angular service worker shows `notification` and navigates on click via `onActionClick`.
  private toServiceWorkerPayload({ title, body, url }: PushPayload): string {
    return JSON.stringify({
      notification: {
        title,
        body,
        data: { onActionClick: { default: { operation: 'navigateLastFocusedOrOpen', url } } },
      },
    });
  }

  private isGone(error: unknown): boolean {
    const statusCode = (error as { statusCode?: number } | null)?.statusCode;
    return statusCode !== undefined && GONE_STATUS_CODES.includes(statusCode);
  }
}
