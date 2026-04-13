import { Controller, Get, Param } from '@nestjs/common';
import { ScorersService } from './scorers.service';

@Controller('scorers')
export class ScorersController {
  constructor(private readonly scorersService: ScorersService) {}

  @Get(':season')
  findBySeason(@Param('season') season: string) {
    return this.scorersService.findBySeason(season);
  }
}
