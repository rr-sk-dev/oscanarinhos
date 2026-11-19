import { Injectable } from '@nestjs/common';
import { EventRepository } from './event.repository';
import {
  EventDatesInvalidException,
  EventGameReadonlyException,
  EventNotFoundException,
  EventRangeInvalidException,
  EventTypeInvalidException,
} from './exceptions/event.exceptions';
import { CreateEventDto, UpdateEventDto } from './types/event.dto';
import { EventEntity, UpdateEventData } from './types/event.entity';

const MAX_RANGE_DAYS = 400;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
const GAME_EDITABLE_FIELDS: ReadonlyArray<keyof UpdateEventDto> = ['notes'];

@Injectable()
export class EventsService {
  constructor(private readonly eventRepository: EventRepository) {}

  async list(teamId: string, from: Date, to: Date): Promise<EventEntity[]> {
    const rangeInMilliseconds = to.getTime() - from.getTime();
    if (Number.isNaN(rangeInMilliseconds) || rangeInMilliseconds <= 0) {
      throw new EventRangeInvalidException();
    }

    if (rangeInMilliseconds > MAX_RANGE_DAYS * MILLISECONDS_PER_DAY) {
      throw new EventRangeInvalidException();
    }

    return this.eventRepository.findByTeamBetween(teamId, from, to);
  }

  async get(teamId: string, eventId: string): Promise<EventEntity> {
    const event = await this.eventRepository.findByIdInTeam(teamId, eventId);
    if (!event) {
      throw new EventNotFoundException();
    }

    return event;
  }

  async create(teamId: string, input: CreateEventDto): Promise<EventEntity> {
    if (input.type === 'GAME') {
      throw new EventTypeInvalidException();
    }

    const startsAt = new Date(input.startsAt);
    const endsAt = input.endsAt ? new Date(input.endsAt) : null;
    const respondBy = input.respondBy ? new Date(input.respondBy) : null;
    this.assertDatesValid(startsAt, endsAt, respondBy);

    return this.eventRepository.create({
      teamId,
      type: input.type,
      title: input.title,
      startsAt,
      endsAt,
      location: input.location ?? null,
      notes: input.notes ?? null,
      respondBy,
    });
  }

  async update(teamId: string, eventId: string, patch: UpdateEventDto): Promise<EventEntity> {
    const event = await this.get(teamId, eventId);

    if (event.type === 'GAME') {
      this.assertGamePatchAllowed(patch);
    }

    const data = this.toUpdateData(patch);
    this.assertDatesValid(
      data.startsAt ?? event.startsAt,
      data.endsAt === undefined ? event.endsAt : data.endsAt,
      data.respondBy === undefined ? event.respondBy : data.respondBy,
    );

    const updated = await this.eventRepository.update(teamId, eventId, data);
    if (!updated) {
      throw new EventNotFoundException();
    }

    return updated;
  }

  private assertGamePatchAllowed(patch: UpdateEventDto): void {
    const hasForbiddenField = (Object.keys(patch) as Array<keyof UpdateEventDto>).some(
      (field) => patch[field] !== undefined && !GAME_EDITABLE_FIELDS.includes(field),
    );
    if (hasForbiddenField) {
      throw new EventGameReadonlyException();
    }
  }

  private assertDatesValid(startsAt: Date, endsAt: Date | null, respondBy: Date | null): void {
    if (endsAt && endsAt.getTime() <= startsAt.getTime()) {
      throw new EventDatesInvalidException();
    }

    if (respondBy && respondBy.getTime() >= startsAt.getTime()) {
      throw new EventDatesInvalidException();
    }
  }

  private toUpdateData(patch: UpdateEventDto): UpdateEventData {
    const data: UpdateEventData = {};
    if (patch.title !== undefined) {
      data.title = patch.title;
    }

    if (patch.startsAt !== undefined) {
      data.startsAt = new Date(patch.startsAt);
    }

    if (patch.endsAt !== undefined) {
      data.endsAt = patch.endsAt === null ? null : new Date(patch.endsAt);
    }

    if (patch.location !== undefined) {
      data.location = patch.location;
    }

    if (patch.notes !== undefined) {
      data.notes = patch.notes;
    }

    if (patch.respondBy !== undefined) {
      data.respondBy = patch.respondBy === null ? null : new Date(patch.respondBy);
    }

    if (patch.status !== undefined) {
      data.status = patch.status;
    }

    return data;
  }
}
