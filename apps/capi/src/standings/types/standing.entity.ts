export class StandingEntity {
  id: string;
  season: string;
  competition: string;
  position: number;
  teamName: string;
  teamLogo: string | null;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateStandingData = Omit<
  StandingEntity,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateStandingData = Partial<
  Omit<StandingEntity, 'id' | 'createdAt' | 'updatedAt'>
>;
