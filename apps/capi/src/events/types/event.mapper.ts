import { Event as PrismaEvent } from '../../../prisma/generated/prisma/client';
import { EventAnswersResponseDto, EventResponseDto } from './event.dto';
import { EventEntity, EventWithAnswers, EventStatus, EventType } from './event.entity';

export class EventMapper {
  static toDomain(record: PrismaEvent): EventEntity {
    return {
      id: record.id,
      teamId: record.teamId,
      type: record.type as EventType,
      title: record.title,
      startsAt: record.startsAt,
      endsAt: record.endsAt,
      location: record.location,
      notes: record.notes,
      respondBy: record.respondBy,
      status: record.status as EventStatus,
      matchId: record.matchId,
      seriesId: record.seriesId,
    };
  }

  static toResponse(event: EventEntity): EventResponseDto {
    return {
      id: event.id,
      teamId: event.teamId,
      type: event.type,
      title: event.title,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt?.toISOString() ?? null,
      location: event.location,
      notes: event.notes,
      respondBy: event.respondBy?.toISOString() ?? null,
      status: event.status,
      matchId: event.matchId,
      seriesId: event.seriesId,
    };
  }

  static toAnswersResponse(event: EventWithAnswers): EventAnswersResponseDto {
    return { ...EventMapper.toResponse(event), myAnswer: event.myAnswer, counts: event.counts };
  }
}
