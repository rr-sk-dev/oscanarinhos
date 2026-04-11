import { enumOf, ValueOf } from '../../utils/ts-utils';

export const PlayerPosition = enumOf({
  GK: 'GK',
  DEF: 'DEF',
  MID: 'MID',
  FWD: 'FWD',
});
export type PlayerPosition = ValueOf<typeof PlayerPosition>;

export const PlayerFoot = enumOf({
  Left: 'LEFT',
  Right: 'RIGHT',
  Both: 'BOTH',
});
export type PlayerFoot = ValueOf<typeof PlayerFoot>;

export const PlayerStatus = enumOf({
  Active: 'ACTIVE',
  Injured: 'INJURED',
  Suspended: 'SUSPENDED',
  Unavailable: 'UNAVAILABLE',
  Retired: 'RETIRED',
});
export type PlayerStatus = ValueOf<typeof PlayerStatus>;

export const LeadershipRole = enumOf({
  None: 'NONE',
  Captain: 'CAPTAIN',
  ViceCaptain: 'VICE_CAPTAIN',
});
export type LeadershipRole = ValueOf<typeof LeadershipRole>;

export class PlayerEntity {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname: string | null;
  shirtNumber: number | null;
  position: PlayerPosition;
  preferredFoot: PlayerFoot;
  dateOfBirth: Date | null;
  photo: string | null;
  bio: string | null;
  status: PlayerStatus;
  leadershipRole: LeadershipRole;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreatePlayerData = Omit<
  PlayerEntity,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdatePlayerData = Partial<
  Omit<PlayerEntity, 'id' | 'createdAt' | 'updatedAt'>
>;
