import { Module } from '@nestjs/common';
import { AvailabilityDataModule } from '../availability/availability-data.module';
import { EmailModule } from '../email/email.module';
import { MembersModule } from '../members/members.module';
import { PushModule } from '../push/push.module';
import { UsersModule } from '../users/users.module';
import { EventChangeListener } from './event-change.listener';
import { NotificationDeliveryService } from './notification-delivery.service';
import { RecipientResolver } from './recipient-resolver.service';

@Module({
  imports: [PushModule, EmailModule, MembersModule, UsersModule, AvailabilityDataModule],
  providers: [RecipientResolver, NotificationDeliveryService, EventChangeListener],
})
export class NotificationsModule {}
