import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaMembershipRepository } from './membership-prisma.repository';
import { MembershipRepository } from './membership.repository';

@Module({
  imports: [DatabaseModule.forFeature('membership')],
  providers: [{ provide: MembershipRepository, useClass: PrismaMembershipRepository }],
  exports: [MembershipRepository],
})
export class MembersModule {}
