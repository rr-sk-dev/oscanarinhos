import { Module } from '@nestjs/common';
import { MatchesModule } from '../matches/matches.module';
import { CifScrapperModule } from './cif-scrapper.module';
import { VideoScrapperService } from './services/video-scrapper.service';
import { YoutubeService } from './youtube/youtube.service';

@Module({
  imports: [CifScrapperModule, MatchesModule],
  providers: [YoutubeService, VideoScrapperService],
})
export class ScrapperModule {}
