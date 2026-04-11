import { BaseRepository } from '../../database';
import {
  CreateTeamStaffData,
  StaffRole,
  TeamStaffEntity,
  UpdateTeamStaffData,
} from './types/team-staff.entity';

export type TeamStaffFilters = {
  teamId?: string;
  teamName?: string;
  role?: StaffRole;
};

export abstract class TeamStaffRepository extends BaseRepository<
  TeamStaffEntity,
  CreateTeamStaffData,
  UpdateTeamStaffData
> {
  abstract findAll(
    filters?: TeamStaffFilters,
  ): Promise<TeamStaffEntity[]>;
  abstract findById(id: string): Promise<TeamStaffEntity | null>;
}
