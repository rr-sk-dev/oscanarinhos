import { Injectable, Logger } from '@nestjs/common';
import { EmailSender } from '../auth/email/email-sender';
import { PushResult, PushSender } from '../push/push-sender';
import { PushSubscriptionEntity } from '../push/push-subscription.entity';
import { PushSubscriptionRepository } from '../push/push-subscription.repository';
import { EmailPacer } from './email-pacer';
import { buildEmailContent, NotificationMessage } from './notification-messages';
import { NotificationRecipient } from './recipient-resolver.service';

export type DeliveryChannel = 'push' | 'email' | 'none';

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  constructor(
    private readonly subscriptions: PushSubscriptionRepository,
    private readonly pushSender: PushSender,
    private readonly emailSender: EmailSender,
    private readonly emailPacer: EmailPacer,
  ) {}

  async deliver(
    recipient: NotificationRecipient,
    message: NotificationMessage,
    eventUrl: string,
  ): Promise<DeliveryChannel> {
    if (await this.tryPush(recipient.userId, message, eventUrl)) {
      return 'push';
    }

    return this.tryEmail(recipient, message, eventUrl);
  }

  private async tryPush(
    userId: string,
    message: NotificationMessage,
    eventUrl: string,
  ): Promise<boolean> {
    if (!this.pushSender.isEnabled) {
      return false;
    }

    let stored: PushSubscriptionEntity[];
    try {
      stored = await this.subscriptions.findByUserId(userId);
    } catch {
      this.logger.warn(`Could not load push subscriptions for user ${userId}`);
      return false;
    }

    const payload = { title: message.title, body: message.body, url: eventUrl };
    const results = await Promise.all(
      stored.map((subscription) => this.sendToSubscription(userId, subscription, payload)),
    );

    return results.includes('sent');
  }

  private async sendToSubscription(
    userId: string,
    subscription: PushSubscriptionEntity,
    payload: { title: string; body: string; url: string },
  ): Promise<PushResult> {
    let result: PushResult;
    try {
      result = await this.pushSender.send(subscription, payload);
    } catch {
      this.logger.warn(`Push send threw for user ${userId}`);
      return 'failed';
    }

    if (result === 'gone') {
      await this.removeGoneSubscription(userId, subscription.endpoint);
    }

    return result;
  }

  private async removeGoneSubscription(userId: string, endpoint: string): Promise<void> {
    try {
      await this.subscriptions.deleteByEndpoint(endpoint);
    } catch {
      this.logger.warn(`Could not delete a gone push subscription for user ${userId}`);
    }
  }

  private async tryEmail(
    recipient: NotificationRecipient,
    message: NotificationMessage,
    eventUrl: string,
  ): Promise<DeliveryChannel> {
    const { subject, body } = buildEmailContent(message, eventUrl);
    try {
      await this.emailPacer.schedule(() => this.emailSender.send(recipient.email, subject, body));
      return 'email';
    } catch {
      this.logger.warn(`Email alert failed for user ${recipient.userId}`);
      return 'none';
    }
  }
}
