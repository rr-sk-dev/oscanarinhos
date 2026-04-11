import { Team as PrismaTeam } from '../../../prisma/generated/prisma/client';
import { TeamEntity } from './team.entity';

export class TeamMapper {
  static toDomain(prismaTeam: PrismaTeam): TeamEntity {
    return {
      id: prismaTeam.id,
      name: prismaTeam.name,
      shortName: prismaTeam.shortName,
      logo: prismaTeam.logo,
      teamPhoto: prismaTeam.teamPhoto,
      webContent: prismaTeam.webContent as PrismaJson.TeamWebContent | null,
      createdAt: prismaTeam.createdAt,
      updatedAt: prismaTeam.updatedAt,
    };
  }
}
