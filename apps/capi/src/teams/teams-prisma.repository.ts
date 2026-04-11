import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { TeamFilters, TeamRepository } from './teams.repository';
import {
  CreateTeamData,
  TeamEntity,
  UpdateTeamData,
} from './types/team.entity';
import { TeamMapper } from './types/team.mapper';

@Injectable()
export class PrismaTeamRepository extends TeamRepository {
  constructor(
    @InjectModel('team') private readonly teamModel: ModelDelegate<'team'>,
  ) {
    super();
  }

  async create(data: CreateTeamData): Promise<TeamEntity> {
    const record = await this.teamModel.create({ data });
    return TeamMapper.toDomain(record);
  }

  async findAll(filters: TeamFilters = {}): Promise<TeamEntity[]> {
    const { name } = filters;

    const records = await this.teamModel.findMany({
      where: {
        ...(name && {
          name: { contains: name, mode: 'insensitive' },
        }),
      },
    });

    return records.map(TeamMapper.toDomain);
  }

  async findById(id: string): Promise<TeamEntity | null> {
    const record = await this.teamModel.findUnique({ where: { id } });
    return record ? TeamMapper.toDomain(record) : null;
  }

  async findByName(name: string): Promise<TeamEntity | null> {
    const record = await this.teamModel.findUnique({ where: { name } });
    return record ? TeamMapper.toDomain(record) : null;
  }

  async update(id: string, data: UpdateTeamData): Promise<TeamEntity> {
    const record = await this.teamModel.update({ where: { id }, data });
    return TeamMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.teamModel.delete({ where: { id } });
  }

  async count(): Promise<number> {
    return this.teamModel.count();
  }
}
