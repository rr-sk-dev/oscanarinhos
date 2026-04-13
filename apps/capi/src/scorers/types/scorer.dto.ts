import { ScorerEntity } from './scorer.entity';

export class ScorerResponseDto {
  id: string;
  season: string;
  rank: number;
  playerName: string;
  teamName: string;
  goals: number;

  static fromEntity(entity: ScorerEntity): ScorerResponseDto {
    const dto = new ScorerResponseDto();
    dto.id = entity.id;
    dto.season = entity.season;
    dto.rank = entity.rank;
    dto.playerName = entity.playerName;
    dto.teamName = entity.teamName;
    dto.goals = entity.goals;
    return dto;
  }
}
