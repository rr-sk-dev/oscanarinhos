import { User as PrismaUser } from '../../../prisma/generated/prisma/client';
import { UserEntity } from './user.entity';

export class UserMapper {
  static toDomain(record: PrismaUser): UserEntity {
    return {
      id: record.id,
      email: record.email,
      name: record.name,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }
}
