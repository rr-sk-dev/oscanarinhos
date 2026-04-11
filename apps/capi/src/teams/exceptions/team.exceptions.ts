import { DomainException } from '../../core/exceptions/base-domain-exception';

export class TeamNotFoundException extends DomainException {
  constructor() {
    super('TEAM_NOT_FOUND', 'Team not found');
  }
}

export class TeamAlreadyExistsException extends DomainException {
  constructor() {
    super('TEAM_ALREADY_EXISTS', 'Team with this name already exists');
  }
}
