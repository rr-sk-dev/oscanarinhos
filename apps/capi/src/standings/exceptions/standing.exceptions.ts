import { DomainException } from '../../core/exceptions/base-domain-exception';

export class StandingNotFoundException extends DomainException {
  constructor() {
    super('STANDING_NOT_FOUND', 'Standing not found');
  }
}
