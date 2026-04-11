import {
    Match as PrismaMatch,
    MatchStatus as PrismaMatchStatus,
    Team as PrismaTeam,
} from '../../../prisma/generated/prisma/client';
import { TeamMapper } from '../../teams/types/team.mapper';
import { MatchEntity, MatchEvent, MatchLineup, MatchStatus } from './match.entity';

type PrismaMatchWithTeams = PrismaMatch & {
  homeTeam?: PrismaTeam;
  awayTeam?: PrismaTeam;
};

export class MatchMapper {
  static toDomain(record: PrismaMatchWithTeams): MatchEntity {
    return {
      id: record.id,
      journey: record.journey,
      kickoffAt: record.kickoffAt,
      label: record.label,
      status: record.status as MatchStatus,
      homeTeamId: record.homeTeamId,
      awayTeamId: record.awayTeamId,
      homeScore: record.homeScore,
      awayScore: record.awayScore,
      location: record.location,
      videoId: record.videoId,
      events: record.events as MatchEvent[] | null,
      lineups: record.lineups as MatchLineup | null,
      ...(record.homeTeam && { homeTeam: TeamMapper.toDomain(record.homeTeam) }),
      ...(record.awayTeam && { awayTeam: TeamMapper.toDomain(record.awayTeam) }),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toStatusPrisma(status: MatchStatus): PrismaMatchStatus {
    return status as PrismaMatchStatus;
  }
}
