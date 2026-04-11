import { DomainException } from '../../../core/exceptions/base-domain-exception';

export class TeamStaffNotFoundException extends DomainException {
  constructor() {
    super('TEAM_STAFF_NOT_FOUND', 'Team staff member not found');
  }
}
