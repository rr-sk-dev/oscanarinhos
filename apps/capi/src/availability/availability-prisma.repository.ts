import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { AvailabilityRepository } from './availability.repository';
import { AvailabilityEntity, UpsertAvailabilityData } from './types/availability.entity';
import { AvailabilityMapper } from './types/availability.mapper';

@Injectable()
export class PrismaAvailabilityRepository extends AvailabilityRepository {
  constructor(
    @InjectModel('availability') private readonly availabilityModel: ModelDelegate<'availability'>,
  ) {
    super();
  }

  async upsert(data: UpsertAvailabilityData): Promise<AvailabilityEntity> {
    const { eventId, membershipId, answer, note } = data;
    const record = await this.availabilityModel.upsert({
      where: { eventId_membershipId: { eventId, membershipId } },
      create: { eventId, membershipId, answer, note },
      update: { answer, note },
    });
    return AvailabilityMapper.toDomain(record);
  }

  async findByEvent(eventId: string): Promise<AvailabilityEntity[]> {
    const records = await this.availabilityModel.findMany({ where: { eventId } });
    return records.map(AvailabilityMapper.toDomain);
  }

  async findByEvents(eventIds: string[]): Promise<AvailabilityEntity[]> {
    const records = await this.availabilityModel.findMany({
      where: { eventId: { in: eventIds } },
    });
    return records.map(AvailabilityMapper.toDomain);
  }
}
