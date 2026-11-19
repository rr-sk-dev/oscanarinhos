import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { EventRepository } from './event.repository';
import { CreateEventData, EventEntity, UpdateEventData } from './types/event.entity';
import { EventMapper } from './types/event.mapper';

@Injectable()
export class PrismaEventRepository extends EventRepository {
  constructor(@InjectModel('event') private readonly eventModel: ModelDelegate<'event'>) {
    super();
  }

  async findByTeamBetween(teamId: string, from: Date, to: Date): Promise<EventEntity[]> {
    const records = await this.eventModel.findMany({
      where: { teamId, startsAt: { gte: from, lt: to } },
      orderBy: { startsAt: 'asc' },
    });
    return records.map(EventMapper.toDomain);
  }

  async findByIdInTeam(teamId: string, id: string): Promise<EventEntity | null> {
    const record = await this.eventModel.findFirst({ where: { id, teamId } });
    return record ? EventMapper.toDomain(record) : null;
  }

  async create(data: CreateEventData): Promise<EventEntity> {
    const record = await this.eventModel.create({ data });
    return EventMapper.toDomain(record);
  }

  async update(teamId: string, id: string, data: UpdateEventData): Promise<EventEntity | null> {
    // teamId is part of the WHERE so an id from another team can never be modified.
    const { count } = await this.eventModel.updateMany({ where: { id, teamId }, data });
    if (count === 0) {
      return null;
    }

    return this.findByIdInTeam(teamId, id);
  }

  async createMany(data: CreateEventData[]): Promise<number> {
    const { count } = await this.eventModel.createMany({ data });
    return count;
  }
}
