import { ValidationPipe } from '@nestjs/common';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import {
  AvailabilityAnswer,
  AvailabilityCounts,
} from '../../availability/types/availability.entity';
import { EVENT_STATUSES, EVENT_TYPES, EventStatus, EventType } from './event.entity';

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ListEventsQueryDto {
  @IsISO8601({ strict: true })
  from: string;

  @IsISO8601({ strict: true })
  to: string;
}

export class CreateEventDto {
  // Not restricted to TRAINING/CUSTOM here: the service rejects GAME with EVENT_TYPE_INVALID.
  @IsIn(EVENT_TYPES)
  type: EventType;

  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsISO8601({ strict: true })
  startsAt: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endsAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  respondBy?: string;
}

// Local to PATCH: unlisted keys (type, teamId, matchId, seriesId...) are a 400 rather than being
// silently dropped. Applied through a custom param decorator because the global pipe (whitelist
// only) would strip them first for regular @Body() params.
export const updateEventValidationPipe = new ValidationPipe({
  transform: true,
  whitelist: true,
  forbidNonWhitelisted: true,
  validateCustomDecorators: true,
});

// Non-nullable fields use ValidateIf (not IsOptional) so an explicit null is rejected.
const isProvided = (_: unknown, value: unknown) => value !== undefined;

export class UpdateEventDto {
  @ValidateIf(isProvided)
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  title?: string;

  @ValidateIf(isProvided)
  @IsISO8601({ strict: true })
  startsAt?: string;

  @IsOptional()
  @IsISO8601({ strict: true })
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsISO8601({ strict: true })
  respondBy?: string | null;

  @ValidateIf(isProvided)
  @IsIn(EVENT_STATUSES)
  status?: EventStatus;

  /** Request-only flag asking to notify the team of a cancel or reschedule; never stored. */
  @IsOptional()
  @IsBoolean()
  notifyTeam?: boolean;
}

export class EventResponseDto {
  id: string;
  teamId: string;
  type: EventType;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  notes: string | null;
  respondBy: string | null;
  status: EventStatus;
  matchId: string | null;
  seriesId: string | null;
}

export class EventAnswersResponseDto extends EventResponseDto {
  myAnswer: AvailabilityAnswer | null;
  counts: AvailabilityCounts;
}
