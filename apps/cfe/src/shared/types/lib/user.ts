export enum Role {
  ADMIN = 'ADMIN',
  COACH = 'COACH',
  PLAYER = 'PLAYER',
  SUPPORTER = 'SUPPORTER',
}

export interface User {
  id: string;
  email: string;
  name: string;
  playerId: string | null;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
}
