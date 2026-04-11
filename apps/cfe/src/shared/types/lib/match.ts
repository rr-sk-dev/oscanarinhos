import { Team } from './team';

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  POSTPONED = 'POSTPONED',
  CANCELED = 'CANCELED',
}

export enum TeamResult {
  WIN = 'Vitória',
  DRAW = 'Empate',
  LOSS = 'Derrota',
}

export interface Match {
  id: string;
  journey: number;
  kickoffAt: string;
  label: string;
  status: MatchStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: Team;
  awayTeam?: Team;
  homeScore: number | null;
  awayScore: number | null;
  location: string | null;
  videoId: string | null;
  createdAt: string;
  updatedAt: string;
}
