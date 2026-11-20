import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { EventChangeKind } from '../events/event-change';
import {
  EVENT_CANCELLED,
  EVENT_RESCHEDULED,
  EventChangedPayload,
} from '../events/types/event-change.events';
import { NotificationDeliveryService } from './notification-delivery.service';
import { buildNotificationMessage, NotificationMessage } from './notification-messages';
import { NotificationRecipient, RecipientResolver } from './recipient-resolver.service';

const DEFAULT_FRONTEND_URL = 'http://localhost:4200';

@Injectable()
export class EventChangeListener {
  private readonly logger = new Logger(EventChangeListener.name);

  constructor(
    private readonly recipientResolver: RecipientResolver,
    private readonly delivery: NotificationDeliveryService,
    private readonly configService: ConfigService,
  ) {}

  @OnEvent(EVENT_CANCELLED, { async: true })
  handleCancelled(payload: EventChangedPayload): Promise<void> {
    return this.notify('cancelled', payload);
  }

  @OnEvent(EVENT_RESCHEDULED, { async: true })
  handleRescheduled(payload: EventChangedPayload): Promise<void> {
    return this.notify('rescheduled', payload);
  }

  private async notify(kind: EventChangeKind, payload: EventChangedPayload): Promise<void> {
    try {
      const recipients = await this.recipientResolver.resolve(
        payload.teamId,
        payload.eventId,
        payload.actorUserId,
      );
      const message = buildNotificationMessage(kind, payload);
      const eventUrl = this.buildEventUrl(payload.eventId);

      // One recipient at a time; email pacing across alerts is EmailPacer's job.
      for (const recipient of recipients) {
        await this.deliverSafely(recipient, message, eventUrl);
      }
    } catch {
      this.logger.error(`Could not process ${kind} alert for event ${payload.eventId}`);
    }
  }

  private async deliverSafely(
    recipient: NotificationRecipient,
    message: NotificationMessage,
    eventUrl: string,
  ): Promise<void> {
    try {
      await this.delivery.deliver(recipient, message, eventUrl);
    } catch {
      this.logger.error(`Alert delivery failed for user ${recipient.userId}`);
    }
  }

  private buildEventUrl(eventId: string): string {
    const configured = this.configService.get<string>('FRONTEND_URL') || DEFAULT_FRONTEND_URL;
    const frontendUrl = configured.replace(/\/+$/, '');
    return `${frontendUrl}/members/events/${eventId}`;
  }
}
