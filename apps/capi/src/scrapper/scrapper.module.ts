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
import { VideoScrapperService } from './services/video-scrapper.service';
import { YoutubeService } from './youtube/youtube.service';

@Module({
  imports: [MatchesModule, TeamsModule, StandingsModule, ScorersModule],
  providers: [
    YoutubeService,
    ResultsPageClient,
    FixturesScrapperService,
    ResultsScrapperService,
    StandingsScrapperService,
    ScorersScrapperService,
    VideoScrapperService,
    ScrapperCronService,
  ],
})
export class ScrapperModule {}
