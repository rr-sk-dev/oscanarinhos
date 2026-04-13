import { Standing as PrismaStanding } from '../../../prisma/generated/prisma/client';
import { StandingEntity } from './standing.entity';

export class StandingMapper {
  static toDomain(record: PrismaStanding): StandingEntity {
    return {
      id: record.id,
      season: record.season,
      position: record.position,
      teamName: record.teamName,
      teamLogo: record.teamLogo,
      gamesPlayed: record.gamesPlayed,
      wins: record.wins,
      draws: record.draws,
      losses: record.losses,
      goalsFor: record.goalsFor,
      goalsAgainst: record.goalsAgainst,
      goalDifference: record.goalDifference,
      points: record.points,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
