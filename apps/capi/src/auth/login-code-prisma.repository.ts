import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { CreateLoginCodeData, LoginCodeEntity, LoginCodeRepository } from './login-code.repository';

@Injectable()
export class PrismaLoginCodeRepository extends LoginCodeRepository {
  constructor(
    @InjectModel('loginCode') private readonly loginCodeModel: ModelDelegate<'loginCode'>,
  ) {
    super();
  }

  async create(data: CreateLoginCodeData): Promise<void> {
    await this.loginCodeModel.create({ data });
  }

  findLatestByEmail(email: string): Promise<LoginCodeEntity | null> {
    return this.loginCodeModel.findFirst({ where: { email }, orderBy: { createdAt: 'desc' } });
  }

  countCreatedSince(email: string, since: Date): Promise<number> {
    return this.loginCodeModel.count({ where: { email, createdAt: { gte: since } } });
  }

  async incrementAttempts(id: string): Promise<number> {
    const record = await this.loginCodeModel.update({
      where: { id },
      data: { attempts: { increment: 1 } },
      select: { attempts: true },
    });
    return record.attempts;
  }

  async consume(id: string): Promise<boolean> {
    const result = await this.loginCodeModel.updateMany({
      where: { id, consumedAt: null },
      data: { consumedAt: new Date() },
    });
    return result.count === 1;
  }
}
