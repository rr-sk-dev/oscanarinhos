import { Injectable } from '@nestjs/common';
import { Prisma } from '../../prisma/generated/prisma/client';
import { InjectModel, ModelDelegate } from '../database';
import { MembershipRepository } from './membership.repository';
import {
  CreateMembershipData,
  MembershipEntity,
  MembershipWithTeam,
  UpdateMembershipData,
} from './types/membership.entity';
import { MembershipAlreadyExistsException } from './exceptions/members.exceptions';
import {
  MEMBERSHIP_INCLUDE,
  MEMBERSHIP_WITH_TEAM_INCLUDE,
  MembershipMapper,
} from './types/membership.mapper';

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

  async findById(id: string): Promise<MembershipEntity | null> {
    const record = await this.membershipModel.findUnique({
      where: { id },
      include: MEMBERSHIP_INCLUDE,
    });
    return record ? MembershipMapper.toDomain(record) : null;
  }

  async findByPlayerId(playerId: string): Promise<MembershipEntity | null> {
    const record = await this.membershipModel.findFirst({
      where: { playerId },
      include: MEMBERSHIP_INCLUDE,
    });
    return record ? MembershipMapper.toDomain(record) : null;
  }

  async findByStaffId(staffId: string): Promise<MembershipEntity | null> {
    const record = await this.membershipModel.findFirst({
      where: { staffId },
      include: MEMBERSHIP_INCLUDE,
    });
    return record ? MembershipMapper.toDomain(record) : null;
  }

  async findByUserWithTeam(userId: string): Promise<MembershipWithTeam[]> {
    const records = await this.membershipModel.findMany({
      where: { userId },
      include: MEMBERSHIP_WITH_TEAM_INCLUDE,
      orderBy: { createdAt: 'asc' },
    });
    return records.map(MembershipMapper.toDomainWithTeam);
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
    try {
      const record = await this.membershipModel.create({ data, include: MEMBERSHIP_INCLUDE });
      return MembershipMapper.toDomain(record);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        throw new MembershipAlreadyExistsException();
      }
      throw error;
    }
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
