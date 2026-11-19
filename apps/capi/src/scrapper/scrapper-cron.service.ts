import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameSyncService } from '../events/game-sync.service';
import { TeamRepository } from '../teams/teams.repository';
import { OUR_TEAM_NAME } from './cif.constants';
import { FixturesScrapperService } from './services/fixtures-scrapper.service';
import { ResultsScrapperService } from './services/results-scrapper.service';
import { ScorersScrapperService } from './services/scorers-scrapper.service';
import { StandingsScrapperService } from './services/standings-scrapper.service';

const SUNDAY_AT_17H = '0 17 * * 0';

@Injectable()
export class ScrapperCronService {
  private readonly logger = new Logger(ScrapperCronService.name);

  constructor(
    private readonly fixturesScrapperService: FixturesScrapperService,
    private readonly resultsScrapperService: ResultsScrapperService,
    private readonly standingsScrapperService: StandingsScrapperService,
    private readonly scorersScrapperService: ScorersScrapperService,
    private readonly teamRepository: TeamRepository,
    private readonly gameSyncService: GameSyncService,
  ) {}

  @Cron(SUNDAY_AT_17H, { timeZone: 'Europe/Lisbon' })
  async runWeeklyScrape(): Promise<void> {
    this.logger.log('Starting weekly scrape job');

    // Fixtures first, so results find this week's matches and kickoffs.
    await this.scrapeFixtures();
    await this.scrapeResults();
    await this.syncGames();
    await this.scrapeStandings();
    await this.scrapeScorers();

    this.logger.log('Weekly scrape job completed');
  }

  private async scrapeFixtures(): Promise<void> {
    try {
      await this.fixturesScrapperService.scrape();
    } catch (err) {
      this.logger.error('FixturesScrapperService failed', err);
    }
  }

  private async scrapeResults(): Promise<void> {
    try {
      await this.resultsScrapperService.scrape();
    } catch (err) {
      this.logger.error('ResultsScrapperService failed', err);
    }
  }

  // The calendar's GAME events follow the matches the two steps above just wrote.
  private async syncGames(): Promise<void> {
    try {
      const team = await this.teamRepository.findByName(OUR_TEAM_NAME);
      if (!team) {
        return;
      }

      await this.gameSyncService.syncTeam(team.id);
    } catch (err) {
      this.logger.error('GameSyncService failed', err);
    }
  }

  private async scrapeStandings(): Promise<void> {
    try {
      await this.standingsScrapperService.scrape();
    } catch (err) {
      this.logger.error('StandingsScrapperService failed', err);
    }
  }

  private async scrapeScorers(): Promise<void> {
    try {
      await this.scorersScrapperService.scrape();
    } catch (err) {
      this.logger.error('ScorersScrapperService failed', err);
    }
  }
}
