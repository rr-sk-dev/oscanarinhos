import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Clock } from '../availability/clock';
import { detectEventChange } from './event-change';
import {
  EVENT_CANCELLED,
  EVENT_RESCHEDULED,
  EventChangedPayload,
} from './types/event-change.events';
import { EventEntity } from './types/event.entity';

// Notifying is best effort: it must never fail or delay the write that triggered it.
export function emitEventChange(
  eventEmitter: EventEmitter2,
  clock: Clock,
  logger: Logger,
  before: EventEntity,
  after: EventEntity,
  actorUserId: string | null,
): void {
  try {
    const kind = detectEventChange(before, after, clock.now());
    if (!kind) {
      return;
    }

    const payload: EventChangedPayload = {
      teamId: after.teamId,
      eventId: after.id,
      title: after.title,
      location: after.location,
      previousStartsAt: before.startsAt,
      startsAt: after.startsAt,
      actorUserId,
    };
    eventEmitter.emit(kind === 'cancelled' ? EVENT_CANCELLED : EVENT_RESCHEDULED, payload);
  } catch (error) {
    logger.error(
      `Failed to emit change for event ${before.id}`,
      error instanceof Error ? error.stack : undefined,
    );
  }
}
