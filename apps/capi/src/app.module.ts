import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './database/database.module';
import { MatchesModule } from './matches/matches.module';
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
    DatabaseModule.forRoot(),
    TeamsModule,
    MatchesModule,
    PlayersModule,
    NewsModule,
    StandingsModule,
    ScorersModule,
    TestimonialsModule,
    ScrapperModule,
  ],
})
export class AppModule {}
