import { BaseRepository } from '../database';
import { CreateScorerData, ScorerEntity, UpdateScorerData } from './types/scorer.entity';

export abstract class ScorersRepository extends BaseRepository<
  ScorerEntity,
  CreateScorerData,
  UpdateScorerData
> {
  abstract findAll(): Promise<ScorerEntity[]>;
  abstract findBySeason(season: string): Promise<ScorerEntity[]>;
  abstract deleteBySeason(season: string): Promise<number>;
}
