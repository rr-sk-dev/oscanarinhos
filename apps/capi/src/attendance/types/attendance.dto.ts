import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsBoolean, IsUUID, ValidateNested } from 'class-validator';

export const MAX_ATTENDANCE_ENTRIES = 200;

export class AttendanceEntryDto {
  @IsUUID()
  membershipId: string;

  @IsBoolean()
  attended: boolean;
}

export class MarkAttendanceDto {
  @IsArray()
  @ArrayMaxSize(MAX_ATTENDANCE_ENTRIES)
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries: AttendanceEntryDto[];
}
