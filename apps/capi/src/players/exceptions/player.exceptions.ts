import { DomainException } from '../../core/exceptions/base-domain-exception';

export class PlayerNotFoundException extends DomainException {
  constructor() {
    super('PLAYER_NOT_FOUND', 'Player not found');
  }
}

export class PlayerShirtNumberTakenException extends DomainException {
  constructor() {
    super(
      'PLAYER_SHIRT_NUMBER_TAKEN',
      'This shirt number is already taken in this team',
    );
  }
}
