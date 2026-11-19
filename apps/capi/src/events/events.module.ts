import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { DatabaseModule } from '../database';
import { MembersModule } from '../members/members.module';
import { PrismaEventRepository } from './event-prisma.repository';
import { EventRepository } from './event.repository';
import { MatchesModule } from '../matches/matches.module';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { GameSyncService } from './game-sync.service';
import { PrismaSeriesRepository } from './series-prisma.repository';
import { SeriesRepository } from './series.repository';
import { SeriesService } from './series.service';

@Module({
  imports: [DatabaseModule.forFeature('event'), MembersModule, MatchesModule],
  controllers: [EventsController],
  providers: [
    JwtAuthGuard,
    TeamMemberGuard,
    RolesGuard,
    { provide: EventRepository, useClass: PrismaEventRepository },
    { provide: SeriesRepository, useClass: PrismaSeriesRepository },
    GameSyncService,
    SeriesService,
    EventsService,
  ],
  exports: [EventRepository, EventsService, GameSyncService],
})
export class EventsModule {}
