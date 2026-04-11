import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../../database';
import {
  TeamStaffFilters,
  TeamStaffRepository,
} from './team-staff.repository';
import {
  CreateTeamStaffData,
  TeamStaffEntity,
  UpdateTeamStaffData,
} from './types/team-staff.entity';
import { TeamStaffMapper } from './types/team-staff.mapper';

@Injectable()
export class PrismaTeamStaffRepository extends TeamStaffRepository {
  constructor(
    @InjectModel('teamStaff')
    private readonly teamStaffModel: ModelDelegate<'teamStaff'>,
  ) {
    super();
  }

  async create(data: CreateTeamStaffData): Promise<TeamStaffEntity> {
    const record = await this.teamStaffModel.create({ data });
    return TeamStaffMapper.toDomain(record);
  }

  async findAll(
    filters: TeamStaffFilters = {},
  ): Promise<TeamStaffEntity[]> {
    const { teamId, teamName, role } = filters;

    const records = await this.teamStaffModel.findMany({
      where: {
        ...(teamId && { teamId }),
        ...(teamName && {
          team: { name: { equals: teamName, mode: 'insensitive' } },
        }),
        ...(role && { role: TeamStaffMapper.toRolePrisma(role) }),
      },
      orderBy: [{ role: 'asc' }, { lastName: 'asc' }],
    });

    return records.map(TeamStaffMapper.toDomain);
  }

  async findById(id: string): Promise<TeamStaffEntity | null> {
    const record = await this.teamStaffModel.findUnique({
      where: { id },
    });
    return record ? TeamStaffMapper.toDomain(record) : null;
  }

  async update(
    id: string,
    data: UpdateTeamStaffData,
  ): Promise<TeamStaffEntity> {
    const record = await this.teamStaffModel.update({
      where: { id },
      data,
    });
    return TeamStaffMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.teamStaffModel.delete({ where: { id } });
  }

  async count(filters: TeamStaffFilters = {}): Promise<number> {
    const { teamId, role } = filters;

    return this.teamStaffModel.count({
      where: {
        ...(teamId && { teamId }),
        ...(role && { role: TeamStaffMapper.toRolePrisma(role) }),
      },
    });
  }
}
