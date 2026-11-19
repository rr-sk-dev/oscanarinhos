import { DomainException } from '../../core/exceptions/base-domain-exception';

export class UserNotFoundException extends DomainException {
  constructor() {
    super('USER_NOT_FOUND', 'User not found');
  }
}
