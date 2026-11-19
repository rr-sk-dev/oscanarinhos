import { DomainException } from '../../core/exceptions/base-domain-exception';

export class EventNotFoundException extends DomainException {
  constructor() {
    super('EVENT_NOT_FOUND', 'Event not found');
  }
}

export class EventTypeInvalidException extends DomainException {
  constructor() {
    super('EVENT_TYPE_INVALID', 'Only TRAINING and CUSTOM events can be created');
  }
}

export class EventDatesInvalidException extends DomainException {
  constructor() {
    super(
      'EVENT_DATES_INVALID',
      'endsAt must be after startsAt and respondBy must be before startsAt',
    );
  }
}

export class EventRangeInvalidException extends DomainException {
  constructor() {
    super('EVENT_RANGE_INVALID', 'The range must have from before to and span at most 400 days');
  }
}

export class EventGameReadonlyException extends DomainException {
  constructor() {
    super(
      'EVENT_GAME_READONLY_FORBIDDEN',
      'Game events take their time, place and status from the match; only notes can be changed',
    );
  }
}
