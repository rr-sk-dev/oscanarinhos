import { Injectable } from '@nestjs/common';
import { PlayerFilters, PlayerRepository } from './players.repository';
import { PlayerResponseDto } from './types/player.dto';

@Injectable()
export class PlayersService {
  constructor(private readonly playerRepository: PlayerRepository) {}

  async findAll(filters: PlayerFilters = {}): Promise<PlayerResponseDto[]> {
    const players = await this.playerRepository.findAll(filters);
    return players.map(PlayerResponseDto.fromEntity);
  }
}
