import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaUserRepository } from './user-prisma.repository';
import { UserRepository } from './user.repository';

@Module({
  imports: [DatabaseModule.forFeature('user')],
  providers: [{ provide: UserRepository, useClass: PrismaUserRepository }],
  exports: [UserRepository],
})
export class UsersModule {}
