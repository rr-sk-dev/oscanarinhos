import { Controller, Get, Query } from '@nestjs/common';
import { PlayersService } from './players.service';
import { PlayerResponseDto } from './types/player.dto';

@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  async find(@Query('teamName') teamName?: string): Promise<PlayerResponseDto[]> {
    return this.playersService.findAll({ teamName });
  }
}
