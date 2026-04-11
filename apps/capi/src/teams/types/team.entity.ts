export class TeamEntity {
  id: string;
  name: string;
  shortName: string | null;
  logo: string;
  teamPhoto: string | null;
  webContent: PrismaJson.TeamWebContent | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTeamData = Omit<TeamEntity, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTeamData = Partial<
  Omit<TeamEntity, 'id' | 'createdAt' | 'updatedAt'>
>;
