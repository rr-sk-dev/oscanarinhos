import { enumOf, ValueOf } from '../../utils/ts-utils';
import { TeamEntity } from '../../teams/types/team.entity';

export const MatchStatus = enumOf({
  Scheduled: 'SCHEDULED',
  InProgress: 'IN_PROGRESS',
  Finished: 'FINISHED',
  Postponed: 'POSTPONED',
  Canceled: 'CANCELED',
});

export type MatchStatus = ValueOf<typeof MatchStatus>;

export interface MatchEvent {
  minute: number;
  type: 'GOAL' | 'YELLOW_CARD' | 'RED_CARD' | 'SUBSTITUTION';
  playerName: string;
  teamId: string;
  detail: string | null;
}

export interface MatchLineup {
  home: LineupPlayer[];
  away: LineupPlayer[];
}

export interface LineupPlayer {
  name: string;
  number: number;
  position: string;
}

export class MatchEntity {
  id: string;
  journey: number;
  kickoffAt: Date;
  label: string;
  status: MatchStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  location: string | null;
  videoId: string | null;
  events: MatchEvent[] | null;
  lineups: MatchLineup | null;
  homeTeam?: TeamEntity;
  awayTeam?: TeamEntity;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateMatchData = Omit<
  MatchEntity,
  'id' | 'createdAt' | 'updatedAt' | 'homeTeam' | 'awayTeam'
>;

export type UpdateMatchData = Partial<
  Omit<MatchEntity, 'id' | 'createdAt' | 'updatedAt' | 'homeTeam' | 'awayTeam'>
>;
