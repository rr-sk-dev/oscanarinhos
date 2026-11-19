import { Transform } from 'class-transformer';
import { IsIn, IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { EVENT_STATUSES, EVENT_TYPES, EventStatus, EventType } from './event.entity';

const trimmed = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class ListEventsQueryDto {
  @IsISO8601()
  from: string;

  @IsISO8601()
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

  @IsISO8601()
  startsAt: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsISO8601()
  respondBy?: string;
}

export class UpdateEventDto {
  @IsOptional()
  @Transform(trimmed)
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsISO8601()
  startsAt?: string;

  @IsOptional()
  @IsISO8601()
  endsAt?: string | null;

  @IsOptional()
  @IsString()
  location?: string | null;

  @IsOptional()
  @IsString()
  notes?: string | null;

  @IsOptional()
  @IsISO8601()
  respondBy?: string | null;

  @IsOptional()
  @IsIn(EVENT_STATUSES)
  status?: EventStatus;
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
