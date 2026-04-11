import { Transform, Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  ValidateNested,
} from 'class-validator';
import { TeamStaffEntity } from '../staff/types/team-staff.entity';
import { TeamEntity } from './team.entity';

export class TeamWebContentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  subtitle: string;

  @IsUrl()
  @IsOptional()
  instagram?: string | null;
}

export class TeamResponseDto {
  id: string;
  name: string;
  shortName: string | null;
  logo: string;
  teamPhoto: string | null;
  webContent: TeamWebContentDto | null;
  createdAt: Date;
  updatedAt: Date;

  static fromEntity(entity: TeamEntity): TeamResponseDto {
    return {
      id: entity.id,
      name: entity.name,
      shortName: entity.shortName,
      logo: entity.logo,
      teamPhoto: entity.teamPhoto,
      webContent: entity.webContent,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class TeamDetailsResponseDto {
  name: string;
  logo: string;
  teamPhoto: string | null;
  webContent: TeamWebContentDto | null;
  staffIds: string[];

  static fromEntity(
    entity: TeamEntity,
    staff: TeamStaffEntity[] = [],
  ): TeamDetailsResponseDto {
    return {
      name: entity.name,
      logo: entity.logo,
      teamPhoto: entity.teamPhoto,
      webContent: entity.webContent,
      staffIds: staff.map((s) => s.id),
    };
  }
}

export class CreateTeamDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  shortName?: string;

  @Transform(({ value }) => {
    if (!value) return undefined;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  })
  @ValidateNested()
  @Type(() => TeamWebContentDto)
  @IsOptional()
  webContent?: TeamWebContentDto;
}

export class UpdateTeamDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  shortName?: string;

  @Transform(({ value }) => {
    if (!value) return undefined;
    try {
      return typeof value === 'string' ? JSON.parse(value) : value;
    } catch {
      return value;
    }
  })
  @ValidateNested()
  @Type(() => TeamWebContentDto)
  @IsOptional()
  webContent?: TeamWebContentDto;
}
