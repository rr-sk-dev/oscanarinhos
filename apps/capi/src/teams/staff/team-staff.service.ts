import { Injectable } from '@nestjs/common';
import { TeamStaffFilters, TeamStaffRepository } from './team-staff.repository';
import { TeamStaffResponseDto } from './types/team-staff.dto';

@Injectable()
export class TeamStaffService {
  constructor(private readonly teamStaffRepository: TeamStaffRepository) {}

  async findAll(filters: TeamStaffFilters = {}): Promise<TeamStaffResponseDto[]> {
    const staffMembers = await this.teamStaffRepository.findAll(filters);
    return staffMembers.map(TeamStaffResponseDto.fromEntity);
  }
}
