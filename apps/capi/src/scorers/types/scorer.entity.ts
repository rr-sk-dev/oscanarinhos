export class ScorerEntity {
  id: string;
  season: string;
  rank: number;
  playerName: string;
  teamName: string;
  goals: number;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateScorerData = Omit<ScorerEntity, 'id' | 'createdAt' | 'updatedAt'>;

export type UpdateScorerData = Partial<Omit<ScorerEntity, 'id' | 'createdAt' | 'updatedAt'>>;
