import { Module } from '@nestjs/common';
import { MembersModule } from '../members/members.module';
import { PushModule } from '../push/push.module';
import { UsersModule } from '../users/users.module';
import { MeController } from './me.controller';
import { MeService } from './me.service';
import { PushSubscriptionsService } from './push-subscriptions.service';

@Module({
  imports: [UsersModule, MembersModule, PushModule],
  controllers: [MeController],
  providers: [MeService, PushSubscriptionsService],
})
export class MeModule {}
