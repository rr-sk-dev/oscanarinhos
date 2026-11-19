import { Injectable } from '@nestjs/common';
import { DateTime } from 'luxon';
import { SeriesInvalidException } from './exceptions/series.exceptions';
import { SeriesRepository } from './series.repository';
import { CreateEventData, EventEntity } from './types/event.entity';
import { CreateSeriesData, SeriesInput } from './types/series.entity';

const TIME_ZONE = 'Europe/Lisbon';
const MAX_OCCURRENCES = 366;
const MIN_DURATION_MINUTES = 1;
const MAX_DURATION_MINUTES = 720;
// Even a single weekday reaches 366 occurrences within 366 weeks; this bounds the day loop.
const MAX_RANGE_DAYS = MAX_OCCURRENCES * 7;
const START_TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

@Injectable()
export class SeriesService {
  constructor(private readonly seriesRepository: SeriesRepository) {}

  async create(teamId: string, input: SeriesInput): Promise<EventEntity[]> {
    const { hour, minute } = this.parseStartTime(input.startTime);
    this.assertWeekdaysValid(input.weekdays);
    this.assertDurationValid(input.durationMinutes);
    const firstDay = this.parseDay(input.startDate);
    const lastDay = this.parseDay(input.endDate);
    const dayCount = lastDay.diff(firstDay, 'days').days;
    if (dayCount < 0) {
      throw new SeriesInvalidException('endDate must not be before startDate');
    }

    if (dayCount > MAX_RANGE_DAYS) {
      throw new SeriesInvalidException('the date range is too long');
    }

    const startsAtList = this.occurrenceStarts(firstDay, dayCount, input.weekdays, hour, minute);
    if (startsAtList.length === 0) {
      throw new SeriesInvalidException('no day in the range matches the weekdays');
    }

    const location = input.location ?? null;
    const series: CreateSeriesData = {
      teamId,
      title: input.title,
      location,
      weekdays: input.weekdays,
      startTime: input.startTime,
      durationMinutes: input.durationMinutes,
      startDate: new Date(Date.UTC(firstDay.year, firstDay.month - 1, firstDay.day)),
      endDate: new Date(Date.UTC(lastDay.year, lastDay.month - 1, lastDay.day)),
    };
    const events = startsAtList.map(
      (startsAt): Omit<CreateEventData, 'seriesId'> => ({
        teamId,
        type: 'TRAINING',
        title: input.title,
        startsAt,
        endsAt: new Date(startsAt.getTime() + input.durationMinutes * 60 * 1000),
        location,
        notes: null,
        respondBy: null,
      }),
    );

    return this.seriesRepository.createWithEvents(series, events);
  }

  // Each occurrence is built from the Lisbon wall clock, so 21:00 stays 21:00 across DST changes.
  private occurrenceStarts(
    firstDay: DateTime,
    dayCount: number,
    weekdays: number[],
    hour: number,
    minute: number,
  ): Date[] {
    const starts: Date[] = [];
    for (let offset = 0; offset <= dayCount; offset++) {
      const day = firstDay.plus({ days: offset });
      if (!weekdays.includes(day.weekday)) {
        continue;
      }

      starts.push(day.set({ hour, minute }).toJSDate());
      if (starts.length > MAX_OCCURRENCES) {
        throw new SeriesInvalidException(`a series has at most ${MAX_OCCURRENCES} occurrences`);
      }
    }

    return starts;
  }

  private parseDay(value: string): DateTime {
    const day = /^\d{4}-\d{2}-\d{2}$/.test(value)
      ? DateTime.fromISO(value, { zone: TIME_ZONE })
      : DateTime.invalid('not a YYYY-MM-DD date');
    if (!day.isValid) {
      throw new SeriesInvalidException('dates must be valid YYYY-MM-DD values');
    }

    return day.startOf('day');
  }

  private parseStartTime(value: string): { hour: number; minute: number } {
    const match = START_TIME_PATTERN.exec(value);
    if (!match) {
      throw new SeriesInvalidException('startTime must be HH:mm');
    }

    return { hour: Number(match[1]), minute: Number(match[2]) };
  }

  private assertWeekdaysValid(weekdays: number[]): void {
    const isValid =
      weekdays.length > 0 && weekdays.every((day) => Number.isInteger(day) && day >= 1 && day <= 7);
    if (!isValid) {
      throw new SeriesInvalidException('weekdays must be a non-empty list of integers from 1 to 7');
    }
  }

  private assertDurationValid(durationMinutes: number): void {
    const isValid =
      Number.isInteger(durationMinutes) &&
      durationMinutes >= MIN_DURATION_MINUTES &&
      durationMinutes <= MAX_DURATION_MINUTES;
    if (!isValid) {
      throw new SeriesInvalidException(
        `durationMinutes must be between ${MIN_DURATION_MINUTES} and ${MAX_DURATION_MINUTES}`,
      );
    }
  }
}
