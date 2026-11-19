import { DomainException } from '../../core/exceptions/base-domain-exception';

export class InviteInvalidException extends DomainException {
  constructor() {
    super('INVITE_INVALID', 'The invite is invalid, expired or already used');
  }
}

export class MembershipAlreadyExistsException extends DomainException {
  constructor() {
    super('MEMBERSHIP_ALREADY_EXISTS', 'This membership already exists');
  }
}

export class MembershipNotFoundException extends DomainException {
  constructor() {
    super('MEMBERSHIP_NOT_FOUND', 'Membership not found');
  }
}

export class LastAdminException extends DomainException {
  constructor() {
    super('LAST_ADMIN_FORBIDDEN', 'A team must keep at least one admin');
  }
}
