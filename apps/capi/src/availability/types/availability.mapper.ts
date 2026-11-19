import { Availability as PrismaAvailability } from '../../../prisma/generated/prisma/client';
import { AvailabilityResponseDto } from './availability.dto';
import { AvailabilityEntity, AvailabilityAnswer } from './availability.entity';

export class AvailabilityMapper {
  static toDomain(record: PrismaAvailability): AvailabilityEntity {
    return {
      id: record.id,
      eventId: record.eventId,
      membershipId: record.membershipId,
      answer: record.answer as AvailabilityAnswer,
      note: record.note,
    };
  }

  static toResponse(entity: AvailabilityEntity): AvailabilityResponseDto {
    return { eventId: entity.eventId, answer: entity.answer, note: entity.note };
  }
}
