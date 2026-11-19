import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { MembershipRepository } from './membership.repository';
import {
  CreateMembershipData,
  MembershipEntity,
  UpdateMembershipData,
} from './types/membership.entity';
import { MEMBERSHIP_INCLUDE, MembershipMapper } from './types/membership.mapper';

@Injectable()
export class PrismaMembershipRepository extends MembershipRepository {
  constructor(
    @InjectModel('membership') private readonly membershipModel: ModelDelegate<'membership'>,
  ) {
    super();
  }

  async findByUserAndTeam(userId: string, teamId: string): Promise<MembershipEntity | null> {
    const record = await this.membershipModel.findUnique({
      where: { userId_teamId: { userId, teamId } },
      include: MEMBERSHIP_INCLUDE,
    });
    return record ? MembershipMapper.toDomain(record) : null;
  }

  async findByTeam(teamId: string): Promise<MembershipEntity[]> {
    const records = await this.membershipModel.findMany({
      where: { teamId },
      include: MEMBERSHIP_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return records.map(MembershipMapper.toDomain);
  }

  countAdmins(teamId: string): Promise<number> {
    return this.membershipModel.count({ where: { teamId, role: 'ADMIN' } });
  }

  async create(data: CreateMembershipData): Promise<MembershipEntity> {
    const record = await this.membershipModel.create({ data, include: MEMBERSHIP_INCLUDE });
    return MembershipMapper.toDomain(record);
  }

  async update(id: string, data: UpdateMembershipData): Promise<MembershipEntity> {
    const record = await this.membershipModel.update({
      where: { id },
      data,
      include: MEMBERSHIP_INCLUDE,
    });
    return MembershipMapper.toDomain(record);
  }

  async delete(id: string): Promise<void> {
    await this.membershipModel.delete({ where: { id } });
  }
}
