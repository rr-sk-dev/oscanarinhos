import { Type, Transform } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { StandingEntity } from './standing.entity';

export class StandingResponseDto {
  id: string;
  season: string;
  competition: string;
  position: number;
  teamName: string;
  teamLogo: string | null;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: StandingEntity): StandingResponseDto {
    return {
      id: entity.id,
      season: entity.season,
      competition: entity.competition,
      position: entity.position,
      teamName: entity.teamName,
      teamLogo: entity.teamLogo,
      gamesPlayed: entity.gamesPlayed,
      wins: entity.wins,
      draws: entity.draws,
      losses: entity.losses,
      goalsFor: entity.goalsFor,
      goalsAgainst: entity.goalsAgainst,
      goalDifference: entity.goalDifference,
      points: entity.points,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class StandingContextResponseDto {
  team: StandingResponseDto;
  above: StandingResponseDto | null;
  below: StandingResponseDto | null;
}

export class CreateStandingDto {
  @IsString()
  season: string;

  @IsString()
  @IsOptional()
  competition?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  position: number;

  @IsString()
  teamName: string;

  @IsString()
  @IsOptional()
  teamLogo?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  gamesPlayed?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  wins?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  draws?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  losses?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  goalsFor?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  goalsAgainst?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsOptional()
  goalDifference?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;
}

export class UpdateStandingDto {
  @IsString()
  @IsOptional()
  season?: string;

  @IsString()
  @IsOptional()
  competition?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(1)
  @IsOptional()
  position?: number;

  @IsString()
  @IsOptional()
  teamName?: string;

  @IsString()
  @IsOptional()
  teamLogo?: string;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  gamesPlayed?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  wins?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  draws?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  losses?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  goalsFor?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  goalsAgainst?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @IsOptional()
  goalDifference?: number;

  @Transform(({ value }) => parseInt(value, 10))
  @IsInt()
  @Min(0)
  @IsOptional()
  points?: number;
}

// ─── Import / bulk-replace ────────────────────────────────────────────────────

export class ImportStandingEntryDto {
  @IsInt()
  @Min(1)
  position: number;

  @IsString()
  teamName: string;

  @IsString()
  @IsOptional()
  teamLogo?: string;

  @IsInt()
  @Min(0)
  gamesPlayed: number;

  @IsInt()
  @Min(0)
  wins: number;

  @IsInt()
  @Min(0)
  draws: number;

  @IsInt()
  @Min(0)
  losses: number;

  @IsInt()
  goalsFor: number;

  @IsInt()
  goalsAgainst: number;

  @IsInt()
  goalDifference: number;

  @IsInt()
  @Min(0)
  points: number;
}

export class ImportStandingsDto {
  @IsString()
  season: string;

  @IsString()
  @IsOptional()
  competition?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportStandingEntryDto)
  entries: ImportStandingEntryDto[];
}
