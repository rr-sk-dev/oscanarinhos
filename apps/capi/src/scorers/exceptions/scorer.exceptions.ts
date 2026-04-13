import { DomainException } from '../../core/exceptions/base-domain-exception';

export class ScorerNotFoundException extends DomainException {
  constructor() {
    super('SCORER_NOT_FOUND', 'Scorer not found');
  }
}
