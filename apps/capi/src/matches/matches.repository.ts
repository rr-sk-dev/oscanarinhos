import { BaseRepository } from '../database';
import {
  CreateMatchData,
  MatchEntity,
  MatchStatus,
  UpdateMatchData,
} from './types/match.entity';

export type MatchFilters = {
  journey?: number;
  status?: MatchStatus;
};

export abstract class MatchRepository extends BaseRepository<
  MatchEntity,
  CreateMatchData,
  UpdateMatchData
> {
  abstract findAll(filters?: MatchFilters): Promise<MatchEntity[]>;
  abstract findById(id: string): Promise<MatchEntity | null>;
  abstract findAllWithTeams(filters?: MatchFilters): Promise<MatchEntity[]>;
  abstract findByIdWithTeams(id: string): Promise<MatchEntity | null>;
  abstract findNextByTeam(teamId: string): Promise<MatchEntity | null>;
  abstract findUpcomingByTeam(teamId: string): Promise<MatchEntity[]>;
  abstract findFinishedByTeam(teamId: string): Promise<MatchEntity[]>;
  abstract findAllByTeam(teamId: string): Promise<MatchEntity[]>;
}
