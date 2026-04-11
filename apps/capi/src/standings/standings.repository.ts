import { BaseRepository } from '../database';
import {
  CreateStandingData,
  StandingEntity,
  UpdateStandingData,
} from './types/standing.entity';

export abstract class StandingsRepository extends BaseRepository<
  StandingEntity,
  CreateStandingData,
  UpdateStandingData
> {
  abstract findAll(): Promise<StandingEntity[]>;
  abstract findBySeason(
    season: string,
    competition?: string,
  ): Promise<StandingEntity[]>;
  abstract findByTeam(
    teamName: string,
    season: string,
    competition?: string,
  ): Promise<StandingEntity | null>;
  abstract deleteBySeason(
    season: string,
    competition: string,
  ): Promise<number>;
}
