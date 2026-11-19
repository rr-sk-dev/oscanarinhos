import { DomainException } from '../../core/exceptions/base-domain-exception';

export class EventNotStartedForbiddenException extends DomainException {
  constructor() {
    super('EVENT_NOT_STARTED_FORBIDDEN', 'Attendance can only be marked after the event started');
  }
}

export class EventCanceledForbiddenException extends DomainException {
  constructor() {
    super('EVENT_CANCELED_FORBIDDEN', 'Attendance cannot be marked for a canceled event');
  }
}

export class StatsRangeInvalidException extends DomainException {
  constructor() {
    super('STATS_RANGE_INVALID', 'The range must have from before to');
  }
}
