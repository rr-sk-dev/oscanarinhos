import { Injectable } from '@nestjs/common';
import { StandingNotFoundException } from './exceptions/standing.exceptions';
import { StandingsRepository } from './standings.repository';
import { StandingContextResponseDto, StandingResponseDto } from './types/standing.dto';

@Injectable()
export class StandingsService {
  constructor(private readonly standingsRepository: StandingsRepository) {}

  async findContext(teamName: string, season: string): Promise<StandingContextResponseDto> {
    const table = await this.standingsRepository.findBySeason(season);
    const idx = table.findIndex(
      (s) => s.teamName.toLowerCase() === teamName.toLowerCase(),
    );
    if (idx === -1) throw new StandingNotFoundException();

    return {
      team: StandingResponseDto.fromEntity(table[idx]),
      above: idx > 0 ? StandingResponseDto.fromEntity(table[idx - 1]) : null,
      below:
        idx < table.length - 1 ? StandingResponseDto.fromEntity(table[idx + 1]) : null,
    };
  }
}
