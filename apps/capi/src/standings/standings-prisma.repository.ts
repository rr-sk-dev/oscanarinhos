import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { StandingsRepository } from './standings.repository';
import {
  CreateStandingData,
  StandingEntity,
  UpdateStandingData,
} from './types/standing.entity';
import { StandingMapper } from './types/standing.mapper';

@Injectable()
export class PrismaStandingsRepository extends StandingsRepository {
  constructor(
    @InjectModel('standing')
    private readonly standingModel: ModelDelegate<'standing'>,
  ) {
    super();
  }

  async create(data: CreateStandingData): Promise<StandingEntity> {
    const record = await this.standingModel.create({ data });
    return StandingMapper.toDomain(record);
  }

  async findAll(): Promise<StandingEntity[]> {
    const records = await this.standingModel.findMany({
      orderBy: [{ season: 'desc' }, { position: 'asc' }],
    });
    return records.map(StandingMapper.toDomain);
  }

  async findById(id: string): Promise<StandingEntity | null> {
    const record = await this.standingModel.findUnique({ where: { id } });
    return record ? StandingMapper.toDomain(record) : null;
  }

  async findBySeason(season: string): Promise<StandingEntity[]> {
    const records = await this.standingModel.findMany({
      where: { season },
      orderBy: { position: 'asc' },
    });
    return records.map(StandingMapper.toDomain);
  }

  async findByTeam(teamName: string, season: string): Promise<StandingEntity | null> {
    const record = await this.standingModel.findFirst({
      where: {
        teamName: { equals: teamName, mode: 'insensitive' },
        season,
      },
    });
    return record ? StandingMapper.toDomain(record) : null;
  }

  async update(id: string, data: UpdateStandingData): Promise<StandingEntity> {
    const record = await this.standingModel.update({ where: { id }, data });
    return StandingMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.standingModel.delete({ where: { id } });
  }

  async deleteBySeason(season: string): Promise<number> {
    const result = await this.standingModel.deleteMany({ where: { season } });
    return result.count;
  }

  async count(): Promise<number> {
    return this.standingModel.count();
  }
}
