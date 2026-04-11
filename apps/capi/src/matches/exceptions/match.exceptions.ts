import { DomainException } from '../../core/exceptions/base-domain-exception';

export class MatchNotFoundException extends DomainException {
  constructor() {
    super('MATCH_NOT_FOUND', 'Match not found');
  }
}

export class MatchSameTeamException extends DomainException {
  constructor() {
    super('MATCH_SAME_TEAM', 'Home and away teams must be different');
  }
}
