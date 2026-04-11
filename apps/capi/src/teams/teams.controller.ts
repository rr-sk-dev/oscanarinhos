import { Controller, Get, Param } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamDetailsResponseDto } from './types/team.dto';

@Controller('teams')
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Get(':name/details')
  async getDetails(@Param('name') name: string): Promise<TeamDetailsResponseDto> {
    return this.teamsService.getDetails(name);
  }
}
