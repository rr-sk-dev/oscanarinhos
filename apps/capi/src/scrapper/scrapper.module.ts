import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { ScorersModule } from '../scorers/scorers.module';
import { StandingsModule } from '../standings/standings.module';
import { ScrapperCronService } from './scrapper-cron.service';
import { ResultsScrapperService } from './services/results-scrapper.service';
import { ScorersScrapperService } from './services/scorers-scrapper.service';
import { StandingsScrapperService } from './services/standings-scrapper.service';
import { VideoScrapperService } from './services/video-scrapper.service';
import { YoutubeService } from './youtube/youtube.service';

@Module({
  imports: [MatchesModule, StandingsModule, ScorersModule],
  providers: [
    YoutubeService,
    ResultsScrapperService,
    StandingsScrapperService,
    ScorersScrapperService,
    VideoScrapperService,
    ScrapperCronService,
  ],
})
export class ScrapperModule {}
