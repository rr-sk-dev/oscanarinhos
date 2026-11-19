import { Transform } from 'class-transformer';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { MembershipRole } from '../../members/types/membership.entity';
import { AVAILABILITY_ANSWERS, AvailabilityAnswer } from './availability.entity';

export const MAX_NOTE_LENGTH = 140;

export class RespondDto {
  @IsIn(AVAILABILITY_ANSWERS)
  answer: AvailabilityAnswer;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(MAX_NOTE_LENGTH)
  note?: string;
}

export class AvailabilityResponseDto {
  eventId: string;
  answer: AvailabilityAnswer;
  note: string | null;
}

export class MemberResponseSummaryDto {
  membershipId: string;
  displayName: string;
  role: MembershipRole;
  note: string | null;
}

export class AvailabilitySummaryDto {
  yes: MemberResponseSummaryDto[];
  maybe: MemberResponseSummaryDto[];
  no: MemberResponseSummaryDto[];
  noAnswer: MemberResponseSummaryDto[];
}
