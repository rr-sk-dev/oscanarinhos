import { BaseRepository } from '../database';
import {
    CreateTeamData,
    TeamEntity,
    UpdateTeamData,
} from './types/team.entity';

export type TeamFilters = { name?: string };

export abstract class TeamRepository extends BaseRepository<
  TeamEntity,
  CreateTeamData,
  UpdateTeamData
> {
  abstract findAll(filters?: TeamFilters): Promise<TeamEntity[]>;
  abstract findByName(name: string): Promise<TeamEntity | null>;
}
