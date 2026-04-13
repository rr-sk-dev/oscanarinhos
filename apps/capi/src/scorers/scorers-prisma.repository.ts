import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { ScorersRepository } from './scorers.repository';
import { CreateScorerData, ScorerEntity, UpdateScorerData } from './types/scorer.entity';
import { ScorerMapper } from './types/scorer.mapper';

@Injectable()
export class PrismaScorersRepository extends ScorersRepository {
  constructor(
    @InjectModel('scorer')
    private readonly scorerModel: ModelDelegate<'scorer'>,
  ) {
    super();
  }

  async create(data: CreateScorerData): Promise<ScorerEntity> {
    const record = await this.scorerModel.create({ data });
    return ScorerMapper.toDomain(record);
  }

  async findAll(): Promise<ScorerEntity[]> {
    const records = await this.scorerModel.findMany({
      orderBy: [{ season: 'desc' }, { rank: 'asc' }],
    });
    return records.map(ScorerMapper.toDomain);
  }

  async findById(id: string): Promise<ScorerEntity | null> {
    const record = await this.scorerModel.findUnique({ where: { id } });
    return record ? ScorerMapper.toDomain(record) : null;
  }

  async findBySeason(season: string): Promise<ScorerEntity[]> {
    const records = await this.scorerModel.findMany({
      where: { season },
      orderBy: { rank: 'asc' },
    });
    return records.map(ScorerMapper.toDomain);
  }

  async update(id: string, data: UpdateScorerData): Promise<ScorerEntity> {
    const record = await this.scorerModel.update({ where: { id }, data });
    return ScorerMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.scorerModel.delete({ where: { id } });
  }

  async deleteBySeason(season: string): Promise<number> {
    const result = await this.scorerModel.deleteMany({ where: { season } });
    return result.count;
  }

  async count(): Promise<number> {
    return this.scorerModel.count();
  }
}
