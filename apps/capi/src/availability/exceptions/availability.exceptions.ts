import { DomainException } from '../../core/exceptions/base-domain-exception';

export class EventClosedForbiddenException extends DomainException {
  constructor() {
    super(
      'EVENT_CLOSED_FORBIDDEN',
      'Answers are closed: the event started, was canceled or its response deadline passed',
    );
  }
}
