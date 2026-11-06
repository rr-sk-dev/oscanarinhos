import { Controller, Get, Param } from '@nestjs/common';
import { StandingsService } from './standings.service';
import { StandingContextResponseDto, StandingResponseDto } from './types/standing.dto';

@Controller('standings')
export class StandingsController {
  constructor(private readonly standingsService: StandingsService) {}

  @Get(':season')
  async findBySeason(@Param('season') season: string): Promise<StandingResponseDto[]> {
    return this.standingsService.findBySeason(season);
  }

  @Get(':season/context/:teamName')
  async findContext(
    @Param('season') season: string,
    @Param('teamName') teamName: string,
  ): Promise<StandingContextResponseDto> {
    return this.standingsService.findContext(teamName, season);
  }
}
