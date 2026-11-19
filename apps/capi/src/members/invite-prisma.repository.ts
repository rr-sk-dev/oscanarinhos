import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { InviteRepository } from './invite.repository';
import { CreateInviteData, InviteEntity } from './types/invite.entity';
import { InviteMapper } from './types/invite.mapper';

@Injectable()
export class PrismaInviteRepository extends InviteRepository {
  constructor(@InjectModel('invite') private readonly inviteModel: ModelDelegate<'invite'>) {
    super();
  }

  async findByCode(code: string): Promise<InviteEntity | null> {
    const record = await this.inviteModel.findUnique({ where: { code } });
    return record ? InviteMapper.toDomain(record) : null;
  }

  async create(data: CreateInviteData): Promise<InviteEntity> {
    const record = await this.inviteModel.create({ data });
    return InviteMapper.toDomain(record);
  }

  async consume(id: string, now: Date): Promise<boolean> {
    // One conditional UPDATE: concurrent accepts of a maxUses=1 invite cannot both succeed.
    const { count } = await this.inviteModel.updateMany({
      where: { id, expiresAt: { gt: now }, uses: { lt: this.inviteModel.fields.maxUses } },
      data: { uses: { increment: 1 } },
    });
    return count === 1;
  }

  async release(id: string): Promise<void> {
    await this.inviteModel.updateMany({
      where: { id, uses: { gt: 0 } },
      data: { uses: { decrement: 1 } },
    });
  }
}
