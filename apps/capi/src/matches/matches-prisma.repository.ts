import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { MatchFilters, MatchRepository } from './matches.repository';
import {
  CreateMatchData,
  MatchEntity,
  UpdateMatchData,
} from './types/match.entity';
import { MatchMapper } from './types/match.mapper';

const TEAM_INCLUDE = { homeTeam: true, awayTeam: true } as const;

@Injectable()
export class PrismaMatchRepository extends MatchRepository {
  constructor(
    @InjectModel('match') private readonly matchModel: ModelDelegate<'match'>,
  ) {
    super();
  }

  async create(data: CreateMatchData): Promise<MatchEntity> {
    const record = await this.matchModel.create({ data });
    return MatchMapper.toDomain(record);
  }

  async findAll(filters: MatchFilters = {}): Promise<MatchEntity[]> {
    const { journey, status } = filters;

    const records = await this.matchModel.findMany({
      where: {
        ...(journey !== undefined && { journey }),
        ...(status && { status: MatchMapper.toStatusPrisma(status) }),
      },
      orderBy: [{ journey: 'asc' }, { kickoffAt: 'asc' }],
    });

    return records.map(MatchMapper.toDomain);
  }

  async findById(id: string): Promise<MatchEntity | null> {
    const record = await this.matchModel.findUnique({
      where: { id },
    });
    return record ? MatchMapper.toDomain(record) : null;
  }

  async findAllWithTeams(filters: MatchFilters = {}): Promise<MatchEntity[]> {
    const { journey, status } = filters;

    const records = await this.matchModel.findMany({
      where: {
        ...(journey !== undefined && { journey }),
        ...(status && { status: MatchMapper.toStatusPrisma(status) }),
      },
      include: TEAM_INCLUDE,
      orderBy: [{ journey: 'asc' }, { kickoffAt: 'asc' }],
    });

    return records.map(MatchMapper.toDomain);
  }

  async findByIdWithTeams(id: string): Promise<MatchEntity | null> {
    const record = await this.matchModel.findUnique({
      where: { id },
      include: TEAM_INCLUDE,
    });
    return record ? MatchMapper.toDomain(record) : null;
  }

  async findNextByTeam(teamId: string): Promise<MatchEntity | null> {
    const record = await this.matchModel.findFirst({
      where: {
        status: MatchMapper.toStatusPrisma('SCHEDULED'),
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      include: TEAM_INCLUDE,
      orderBy: { kickoffAt: 'asc' },
    });
    return record ? MatchMapper.toDomain(record) : null;
  }

  async update(
    id: string,
    data: UpdateMatchData,
  ): Promise<MatchEntity> {
    const record = await this.matchModel.update({
      where: { id },
      data,
    });
    return MatchMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.matchModel.delete({ where: { id } });
  }

  async count(filters: MatchFilters = {}): Promise<number> {
    const { status } = filters;

    return this.matchModel.count({
      where: {
        ...(status && { status: MatchMapper.toStatusPrisma(status) }),
      },
    });
  }

  async findUpcomingByTeam(teamId: string): Promise<MatchEntity[]> {
    const records = await this.matchModel.findMany({
      where: {
        status: MatchMapper.toStatusPrisma('SCHEDULED'),
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      include: TEAM_INCLUDE,
      orderBy: [{ journey: 'asc' }, { kickoffAt: 'asc' }],
    });

    return records.map(MatchMapper.toDomain);
  }

  async findAllByTeam(teamId: string): Promise<MatchEntity[]> {
    const records = await this.matchModel.findMany({
      where: {
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      include: TEAM_INCLUDE,
      orderBy: { kickoffAt: 'desc' },
    });

    return records.map(MatchMapper.toDomain);
  }

  async findFinishedByTeam(teamId: string): Promise<MatchEntity[]> {
    const records = await this.matchModel.findMany({
      where: {
        status: MatchMapper.toStatusPrisma('FINISHED'),
        OR: [{ homeTeamId: teamId }, { awayTeamId: teamId }],
      },
      include: TEAM_INCLUDE,
      orderBy: [{ journey: 'desc' }, { kickoffAt: 'desc' }],
    });

    return records.map(MatchMapper.toDomain);
  }
}
