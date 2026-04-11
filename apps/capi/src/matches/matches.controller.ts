import { Controller, Get, Param } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchResponseDto } from './types/match.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('next/:team')
  async findNext(@Param('team') team: string): Promise<MatchResponseDto | null> {
    return this.matchesService.findNextByTeam(team);
  }

  @Get('upcoming/:team')
  async findUpcoming(@Param('team') team: string): Promise<MatchResponseDto[]> {
    return this.matchesService.findUpcomingByTeam(team);
  }

  @Get('by-team/:team')
  async findAllByTeam(@Param('team') team: string): Promise<MatchResponseDto[]> {
    return this.matchesService.findAllByTeam(team);
  }

  @Get('results/:team')
  async findResults(@Param('team') team: string): Promise<MatchResponseDto[]> {
    return this.matchesService.findFinishedByTeam(team);
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<MatchResponseDto> {
    return this.matchesService.findByIdPublic(id);
  }
}
