import { Injectable } from '@nestjs/common';
import { TeamStaffRepository } from './staff/team-staff.repository';
import { TeamNotFoundException } from './exceptions/team.exceptions';
import { TeamRepository } from './teams.repository';
import { TeamDetailsResponseDto } from './types/team.dto';

@Injectable()
export class TeamsService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private readonly teamStaffRepository: TeamStaffRepository,
  ) {}

  async getDetails(name: string): Promise<TeamDetailsResponseDto> {
    const team = await this.teamRepository.findByName(name);
    if (!team) throw new TeamNotFoundException();
    const staff = await this.teamStaffRepository.findAll({ teamId: team.id });
    return TeamDetailsResponseDto.fromEntity(team, staff);
  }
}
