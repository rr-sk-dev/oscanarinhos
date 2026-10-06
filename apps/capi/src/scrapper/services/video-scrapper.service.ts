import { Injectable, Logger } from '@nestjs/common';
import { MatchRepository } from '../../matches/matches.repository';
import { MatchEntity } from '../../matches/types/match.entity';
import { normalizeTeamName } from '../team-name';
import { YoutubeService } from '../youtube/youtube.service';

/**
 * Parses "Jornada 26 - Canarinhos vs SD 76" into { journey, home, away }.
 */
function parseTitle(title: string): { journey: number; home: string; away: string } | null {
  const match = title.match(/[Jj]ornada\s+(\d+)\s+-\s+(.+?)\s+vs\s+(.+)/);
  if (!match) return null;
  return {
    journey: parseInt(match[1], 10),
    home: match[2].trim(),
    away: match[3].trim(),
  };
}

@Injectable()
export class VideoScrapperService {
  private readonly logger = new Logger(VideoScrapperService.name);

  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly matchRepository: MatchRepository,
  ) {}

  async scrape(): Promise<void> {
    this.logger.log('Fetching all completed streams from channel');

    const [videos, matches] = await Promise.all([
      this.youtubeService.getAllStreams(),
      this.matchRepository.findAllWithTeams(),
    ]);

    this.logger.log(`Found ${videos.length} video(s), ${matches.length} match(es) in DB`);

    const pool = [...matches];
    let linked = 0;

    for (const video of videos) {
      const match = this.findMatchForVideo(video.title, pool);
      if (!match) {
        this.logger.warn(`No DB match for: "${video.title}"`);
        continue;
      }

      await this.matchRepository.update(match.id, { videoId: video.videoId });
      pool.splice(pool.indexOf(match), 1);

      this.logger.log(`Linked "${video.title}" → match ${match.id}`);
      linked++;
    }

    this.logger.log(`Linked ${linked} video(s) to matches`);
  }

  private findMatchForVideo(title: string, matches: MatchEntity[]): MatchEntity | null {
    const parsed = parseTitle(title);
    if (!parsed) return null;

    const { journey, home, away } = parsed;
    const normHome = normalizeTeamName(home);
    const normAway = normalizeTeamName(away);

    return (
      matches.find((m) => {
        if (m.journey !== journey) return false;
        if (!m.homeTeam || !m.awayTeam) return false;
        return (
          normalizeTeamName(m.homeTeam.name) === normHome &&
          normalizeTeamName(m.awayTeam.name) === normAway
        );
      }) ?? null
    );
  }
}
