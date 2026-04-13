import { Injectable } from '@nestjs/common';
import { ScorerNotFoundException } from './exceptions/scorer.exceptions';
import { ScorersRepository } from './scorers.repository';
import { ScorerResponseDto } from './types/scorer.dto';

@Injectable()
export class ScorersService {
  constructor(private readonly scorersRepository: ScorersRepository) {}

  async findBySeason(season: string): Promise<ScorerResponseDto[]> {
    const scorers = await this.scorersRepository.findBySeason(season);
    return scorers.map(ScorerResponseDto.fromEntity);
  }

  async findById(id: string): Promise<ScorerResponseDto> {
    const scorer = await this.scorersRepository.findById(id);
    if (!scorer) throw new ScorerNotFoundException();
    return ScorerResponseDto.fromEntity(scorer);
  }
}
