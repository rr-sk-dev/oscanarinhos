import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { SeriesRepository } from './series.repository';
import { CreateEventData, EventEntity } from './types/event.entity';
import { EventMapper } from './types/event.mapper';
import { CreateSeriesData } from './types/series.entity';

@Injectable()
export class PrismaSeriesRepository extends SeriesRepository {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async createWithEvents(
    series: CreateSeriesData,
    events: Array<Omit<CreateEventData, 'seriesId'>>,
  ): Promise<EventEntity[]> {
    const records = await this.prisma.$transaction(async (transaction) => {
      const createdSeries = await transaction.eventSeries.create({ data: series });
      return transaction.event.createManyAndReturn({
        data: events.map((event) => ({ ...event, seriesId: createdSeries.id })),
      });
    });

    return records
      .map(EventMapper.toDomain)
      .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  }
}
