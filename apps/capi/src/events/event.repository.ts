import { CreateEventData, EventEntity, UpdateEventData } from './types/event.entity';

/**
 * Every method is scoped by team. `findByIdInTeam` is the only lookup by id and `update`
 * is scoped by team too, so an event id from another team can never be read or modified.
 */
export abstract class EventRepository {
  abstract findByTeamBetween(teamId: string, from: Date, to: Date): Promise<EventEntity[]>;
  abstract findByIdInTeam(teamId: string, id: string): Promise<EventEntity | null>;
  abstract create(data: CreateEventData): Promise<EventEntity>;
  /** Resolves to null when no event with this id exists in the team. */
  abstract update(teamId: string, id: string, data: UpdateEventData): Promise<EventEntity | null>;
  abstract createMany(data: CreateEventData[]): Promise<number>;
}
