import { Injectable, Logger } from '@nestjs/common';
import { EventRepository } from './event.repository';
import { GameSyncService } from './game-sync.service';
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
  private readonly logger = new Logger(EventsService.name);

  constructor(
    private readonly eventRepository: EventRepository,
    private readonly gameSyncService: GameSyncService,
  ) {}

  async list(teamId: string, from: Date, to: Date): Promise<EventEntity[]> {
    const rangeInMilliseconds = to.getTime() - from.getTime();
    if (Number.isNaN(rangeInMilliseconds) || rangeInMilliseconds <= 0) {
      throw new EventRangeInvalidException();
    }

    if (rangeInMilliseconds > MAX_RANGE_DAYS * MILLISECONDS_PER_DAY) {
      throw new EventRangeInvalidException();
    }

    // Idempotent; keeps the calendar from ever missing a game, whatever range is requested.
    try {
      await this.gameSyncService.syncTeam(teamId);
    } catch (error) {
      // A failed sync must not take the calendar read down with it.
      this.logger.error(
        `Game sync failed for team ${teamId}`,
        error instanceof Error ? error.stack : undefined,
      );
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

    const startsAt = this.parseDate(input.startsAt);
    const endsAt = input.endsAt ? this.parseDate(input.endsAt) : null;
    const respondBy = input.respondBy ? this.parseDate(input.respondBy) : null;
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

  private parseDate(value: string): Date {
    const date = new Date(value);
    if (Number.isNaN(date.getTime()) || this.hasRolledOverCalendarDay(value)) {
      throw new EventDatesInvalidException();
    }

    return date;
  }

  // V8 accepts impossible days such as 2026-02-30 and rolls them into the next month.
  private hasRolledOverCalendarDay(value: string): boolean {
    const [year, month, day] = value.slice(0, 10).split('-').map(Number);
    const calendarDay = new Date(Date.UTC(year, month - 1, day));
    return calendarDay.getUTCMonth() !== month - 1 || calendarDay.getUTCDate() !== day;
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
      data.startsAt = this.parseDate(patch.startsAt);
    }

    if (patch.endsAt !== undefined) {
      data.endsAt = patch.endsAt === null ? null : this.parseDate(patch.endsAt);
    }

    if (patch.location !== undefined) {
      data.location = patch.location;
    }

    if (patch.notes !== undefined) {
      data.notes = patch.notes;
    }

    if (patch.respondBy !== undefined) {
      data.respondBy = patch.respondBy === null ? null : this.parseDate(patch.respondBy);
    }

    if (patch.status !== undefined) {
      data.status = patch.status;
    }

    return data;
  }
}
