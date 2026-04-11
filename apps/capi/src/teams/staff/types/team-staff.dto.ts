import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { StaffRole, TeamStaffEntity } from './team-staff.entity';

export class TeamStaffResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  dateOfBirth: Date | null;
  photo: string | null;
  bio: string | null;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: TeamStaffEntity): TeamStaffResponseDto {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      role: entity.role,
      dateOfBirth: entity.dateOfBirth,
      photo: entity.photo,
      bio: entity.bio,
      teamId: entity.teamId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class CreateTeamStaffDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsEnum(StaffRole)
  role: StaffRole;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUUID()
  teamId: string;
}

export class UpdateTeamStaffDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  lastName?: string;

  @IsEnum(StaffRole)
  @IsOptional()
  role?: StaffRole;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @IsString()
  @IsOptional()
  bio?: string;

  @IsUUID()
  @IsOptional()
  teamId?: string;
}
