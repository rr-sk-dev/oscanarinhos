import { AvailabilityEntity, UpsertAvailabilityData } from './types/availability.entity';

/**
 * Callers resolve the event through the team-scoped EventRepository first; these methods take
 * event ids that were already verified to belong to the team.
 */
export abstract class AvailabilityRepository {
  /** Insert or update on (eventId, membershipId). */
  abstract upsert(data: UpsertAvailabilityData): Promise<AvailabilityEntity>;
  abstract findByEvent(eventId: string): Promise<AvailabilityEntity[]>;
  abstract findByEvents(eventIds: string[]): Promise<AvailabilityEntity[]>;
}
