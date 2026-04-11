import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import {
  LeadershipRole,
  PlayerEntity,
  PlayerFoot,
  PlayerPosition,
  PlayerStatus,
} from './player.entity';

export class PlayerResponseDto {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nickname: string | null;
  shirtNumber: number | null;
  position: PlayerPosition;
  preferredFoot: PlayerFoot;
  dateOfBirth: Date | null;
  photo: string | null;
  bio: string | null;
  status: PlayerStatus;
  leadershipRole: LeadershipRole;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: PlayerEntity): PlayerResponseDto {
    return {
      id: entity.id,
      firstName: entity.firstName,
      lastName: entity.lastName,
      fullName: entity.fullName,
      nickname: entity.nickname,
      shirtNumber: entity.shirtNumber,
      position: entity.position,
      preferredFoot: entity.preferredFoot,
      dateOfBirth: entity.dateOfBirth,
      photo: entity.photo,
      bio: entity.bio,
      status: entity.status,
      leadershipRole: entity.leadershipRole,
      teamId: entity.teamId,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class CreatePlayerDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nickname?: string;

  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  shirtNumber?: number;

  @IsEnum(PlayerPosition)
  position: PlayerPosition;

  @IsEnum(PlayerFoot)
  preferredFoot: PlayerFoot;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @IsUUID()
  teamId: string;
}

export class UpdatePlayerDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  fullName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  nickname?: string;

  @Transform(({ value }) => {
    if (value === null || value === 'null') return null;
    if (value !== undefined) return parseInt(value, 10);
    return undefined;
  })
  @IsInt()
  @Min(1)
  @Max(99)
  @IsOptional()
  shirtNumber?: number | null;

  @IsEnum(PlayerPosition)
  @IsOptional()
  position?: PlayerPosition;

  @IsEnum(PlayerFoot)
  @IsOptional()
  preferredFoot?: PlayerFoot;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  @IsOptional()
  dateOfBirth?: Date;

  @IsEnum(PlayerStatus)
  @IsOptional()
  status?: PlayerStatus;

  @IsEnum(LeadershipRole)
  @IsOptional()
  leadershipRole?: LeadershipRole;

  @IsUUID()
  @IsOptional()
  teamId?: string;
}
