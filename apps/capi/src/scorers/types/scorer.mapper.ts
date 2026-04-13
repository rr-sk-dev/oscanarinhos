import { Scorer as PrismaScorer } from '../../../prisma/generated/prisma/client';
import { ScorerEntity } from './scorer.entity';

export class ScorerMapper {
  static toDomain(record: PrismaScorer): ScorerEntity {
    return {
      id: record.id,
      season: record.season,
      rank: record.rank,
      playerName: record.playerName,
      teamName: record.teamName,
      goals: record.goals,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
