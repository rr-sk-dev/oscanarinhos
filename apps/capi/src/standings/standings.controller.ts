import { Controller, Get, Param, Query } from '@nestjs/common';
import { StandingsService } from './standings.service';
import { StandingContextResponseDto } from './types/standing.dto';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get(':season/context/:teamName')
  async findContext(
    @Param('season') season: string,
    @Param('teamName') teamName: string,
    @Query('competition') competition?: string,
  ): Promise<StandingContextResponseDto> {
    return this.standingsService.findContext(teamName, season, competition);
  }
}
