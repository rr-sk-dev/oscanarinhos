import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { DatabaseModule } from '../database';
import { MembersModule } from '../members/members.module';
import { PrismaEventRepository } from './event-prisma.repository';
import { EventRepository } from './event.repository';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  imports: [DatabaseModule.forFeature('event'), MembersModule],
  controllers: [EventsController],
  providers: [
    JwtAuthGuard,
    TeamMemberGuard,
    RolesGuard,
    { provide: EventRepository, useClass: PrismaEventRepository },
    EventsService,
  ],
  exports: [EventRepository, EventsService],
})
export class EventsModule {}
