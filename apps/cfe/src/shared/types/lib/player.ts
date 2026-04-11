export enum PlayerPosition {
  GK = 'GK',
  DEF = 'DEF',
  MID = 'MID',
  FWD = 'FWD',
}

export enum PlayerFoot {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  BOTH = 'BOTH',
}

export enum PlayerStatus {
  ACTIVE = 'ACTIVE',
  INJURED = 'INJURED',
  SUSPENDED = 'SUSPENDED',
  UNAVAILABLE = 'UNAVAILABLE',
  RETIRED = 'RETIRED',
}

export enum LeadershipRole {
  NONE = 'NONE',
  CAPTAIN = 'CAPTAIN',
  VICE_CAPTAIN = 'VICE_CAPTAIN',
}

export interface Player {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname: string | null;
  shirtNumber: number | null;
  position: PlayerPosition;
  preferredFoot: PlayerFoot;
  dateOfBirth: string | null;
  photo: string | null;
  status: PlayerStatus;
  leadershipRole: LeadershipRole;
  teamId: string;
  createdAt: string;
  updatedAt: string;
}
