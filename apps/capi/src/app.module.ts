import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './auth/auth.module';
import { AttendanceModule } from './attendance/attendance.module';
import { AvailabilityModule } from './availability/availability.module';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './database/database.module';
import { MatchesModule } from './matches/matches.module';
import { MeModule } from './me/me.module';
import { MembersModule } from './members/members.module';
import { EventsModule } from './events/events.module';
import { NewsModule } from './news/news.module';
import { PlayersModule } from './players/players.module';
import { ScrapperModule } from './scrapper/scrapper.module';
import { ScorersModule } from './scorers/scorers.module';
import { StandingsModule } from './standings/standings.module';
import { TeamsModule } from './teams/teams.module';
import { TestimonialsModule } from './testimonials/testimonial.module';

@Module({
  imports: [
    CoreModule,
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot(),
    DatabaseModule.forRoot(),
    TeamsModule,
    MatchesModule,
    PlayersModule,
    NewsModule,
    StandingsModule,
    ScorersModule,
    TestimonialsModule,
    ScrapperModule,
    AuthModule,
    MembersModule,
    EventsModule,
    AvailabilityModule,
    AttendanceModule,
    MeModule,
  ],
})
export class AppModule {}
