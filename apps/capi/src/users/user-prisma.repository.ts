import { Injectable } from '@nestjs/common';
import { InjectModel, ModelDelegate } from '../database';
import { CreateUserData, UserEntity } from './types/user.entity';
import { UserMapper } from './types/user.mapper';
import { UserRepository } from './user.repository';

@Injectable()
export class PrismaUserRepository extends UserRepository {
  constructor(@InjectModel('user') private readonly userModel: ModelDelegate<'user'>) {
    super();
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await this.userModel.findUnique({ where: { email } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async findById(id: string): Promise<UserEntity | null> {
    const record = await this.userModel.findUnique({ where: { id } });
    return record ? UserMapper.toDomain(record) : null;
  }

  async create(data: CreateUserData): Promise<UserEntity> {
    const record = await this.userModel.create({ data });
    return UserMapper.toDomain(record);
  }
}
