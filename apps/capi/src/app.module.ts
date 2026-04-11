import { Module } from '@nestjs/common';
import { CoreModule } from './core/core.module';
import { DatabaseModule } from './database/database.module';
import { MatchesModule } from './matches/matches.module';
import { NewsModule } from './news/news.module';
import { PlayersModule } from './players/players.module';
import { StandingsModule } from './standings/standings.module';
import { TeamsModule } from './teams/teams.module';
import { TestimonialsModule } from './testimonials/testimonial.module';

@Module({
  imports: [
    CoreModule,
    DatabaseModule.forRoot(),
    TeamsModule,
    MatchesModule,
    PlayersModule,
    NewsModule,
    StandingsModule,
    TestimonialsModule,
  ],
})
export class AppModule {}
