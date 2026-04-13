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
  abstract findBySeason(season: string): Promise<StandingEntity[]>;
  abstract findByTeam(teamName: string, season: string): Promise<StandingEntity | null>;
  abstract deleteBySeason(season: string): Promise<number>;
}
