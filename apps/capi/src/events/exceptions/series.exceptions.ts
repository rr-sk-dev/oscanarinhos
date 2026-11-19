import { DomainException } from '../../core/exceptions/base-domain-exception';

export class SeriesInvalidException extends DomainException {
  constructor(reason: string) {
    super('SERIES_INVALID', `Invalid recurring series: ${reason}`);
  }
}
