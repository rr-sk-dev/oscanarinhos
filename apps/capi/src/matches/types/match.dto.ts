import { Transform } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { MatchEntity, MatchEvent, MatchLineup, MatchStatus } from './match.entity';

export class MatchTeamDto {
  id: string;
  name: string;
  shortName: string | null;
  logo: string;
}

export class MatchResponseDto {
  id: string;
  journey: number;
  kickoffAt: Date;
  label: string;
  status: MatchStatus;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  location: string | null;
  videoId: string | null;
  events: MatchEvent[] | null;
  lineups: MatchLineup | null;
  homeTeam?: MatchTeamDto;
  awayTeam?: MatchTeamDto;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: MatchEntity): MatchResponseDto {
    return {
      id: entity.id,
      journey: entity.journey,
      kickoffAt: entity.kickoffAt,
      label: entity.label,
      status: entity.status,
      homeTeamId: entity.homeTeamId,
      awayTeamId: entity.awayTeamId,
      homeScore: entity.homeScore,
      awayScore: entity.awayScore,
      location: entity.location,
      videoId: entity.videoId,
      events: entity.events,
      lineups: entity.lineups,
      ...(entity.homeTeam && {
        homeTeam: {
          id: entity.homeTeam.id,
          name: entity.homeTeam.name,
          shortName: entity.homeTeam.shortName,
          logo: entity.homeTeam.logo,
        },
      }),
      ...(entity.awayTeam && {
        awayTeam: {
          id: entity.awayTeam.id,
          name: entity.awayTeam.name,
          shortName: entity.awayTeam.shortName,
          logo: entity.awayTeam.logo,
        },
      }),
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class CreateMatchDto {
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  @Min(1)
  journey: number;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  kickoffAt: Date;

  @IsString()
  @IsNotEmpty()
  label: string;

  @IsUUID()
  homeTeamId: string;

  @IsUUID()
  awayTeamId: string;

  @IsString()
  @IsOptional()
  location?: string;
}

export class UpdateMatchDto {
  @Transform(({ value }) =>
    value !== undefined ? parseInt(value, 10) : undefined,
  )
  @IsInt()
  @Min(1)
  @IsOptional()
  journey?: number;

  @Transform(({ value }) => (value ? new Date(value) : undefined))
  @IsDate()
  @IsOptional()
  kickoffAt?: Date;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  label?: string;

  @IsEnum(MatchStatus)
  @IsOptional()
  status?: MatchStatus;

  @IsUUID()
  @IsOptional()
  homeTeamId?: string;

  @IsUUID()
  @IsOptional()
  awayTeamId?: string;

  @Transform(({ value }) => {
    if (value === null || value === 'null') return null;
    if (value !== undefined) return parseInt(value, 10);
    return undefined;
  })
  @IsNumber()
  @IsOptional()
  homeScore?: number | null;

  @Transform(({ value }) => {
    if (value === null || value === 'null') return null;
    if (value !== undefined) return parseInt(value, 10);
    return undefined;
  })
  @IsNumber()
  @IsOptional()
  awayScore?: number | null;

  @IsString()
  @IsOptional()
  location?: string | null;

  @IsString()
  @IsOptional()
  videoId?: string | null;

}
