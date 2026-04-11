import { DomainException } from '../../core/exceptions/base-domain-exception';

export class NewsNotFoundException extends DomainException {
  constructor() {
    super('NEWS_NOT_FOUND', 'News article not found');
  }
}

export class NewsSlugAlreadyExistsException extends DomainException {
  constructor() {
    super(
      'NEWS_ALREADY_EXISTS',
      'A news article with this title already exists',
    );
  }
}
