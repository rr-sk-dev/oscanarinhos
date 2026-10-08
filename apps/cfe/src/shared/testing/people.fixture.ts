import {
  LeadershipRole,
  Player,
  PlayerFoot,
  PlayerPosition,
  PlayerStatus,
  StaffRole,
  TeamStaff,
} from '@canarinhos/shared-types';

/** A test player; override any field. */
export function aPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'p1',
    firstName: 'João',
    lastName: 'Silva',
    fullName: '',
    nickname: null,
    shirtNumber: 10,
    position: PlayerPosition.MID,
    preferredFoot: PlayerFoot.RIGHT,
    dateOfBirth: null,
    photo: null,
    status: PlayerStatus.ACTIVE,
    leadershipRole: LeadershipRole.NONE,
    teamId: 't1',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}

/** A test staff member; override any field. */
export function aStaffMember(overrides: Partial<TeamStaff> = {}): TeamStaff {
  return {
    id: 's1',
    firstName: 'Rui',
    lastName: 'Costa',
    role: StaffRole.COACH,
    dateOfBirth: null,
    photo: null,
    teamId: 't1',
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}
