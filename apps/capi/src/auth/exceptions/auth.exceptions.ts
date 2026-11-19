import { DomainException } from '../../core/exceptions/base-domain-exception';

export class InvalidLoginCodeException extends DomainException {
  constructor() {
    super('LOGIN_CODE_INVALID', 'The code is invalid or has expired');
  }
}

export class NotATeamMemberException extends DomainException {
  constructor() {
    super('TEAM_FORBIDDEN', 'You are not a member of this team');
  }
}

export class RoleForbiddenException extends DomainException {
  constructor() {
    super('ROLE_FORBIDDEN', 'Your role is not allowed to do this');
  }
}
