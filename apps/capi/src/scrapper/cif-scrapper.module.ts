import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { ScorersModule } from '../scorers/scorers.module';
import { StandingsModule } from '../standings/standings.module';
import { TeamsModule } from '../teams/teams.module';
import { ResultsPageClient } from './clients/results-page.client';
import { ScrapperCronService } from './scrapper-cron.service';
import { FixturesScrapperService } from './services/fixtures-scrapper.service';
import { ResultsScrapperService } from './services/results-scrapper.service';
import { ScorersScrapperService } from './services/scorers-scrapper.service';
import { StandingsScrapperService } from './services/standings-scrapper.service';

/** The cif.org.pt scrapers and their weekly job, without the YouTube side. */
@Module({
  imports: [MatchesModule, TeamsModule, StandingsModule, ScorersModule],
  providers: [
    ResultsPageClient,
    FixturesScrapperService,
    ResultsScrapperService,
    StandingsScrapperService,
    ScorersScrapperService,
    ScrapperCronService,
  ],
  exports: [ScrapperCronService],
})
export class CifScrapperModule {}
