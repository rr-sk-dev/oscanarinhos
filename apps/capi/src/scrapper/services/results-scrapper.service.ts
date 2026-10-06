import { Injectable, Logger } from '@nestjs/common';
import { MatchRepository } from '../../matches/matches.repository';
import { MatchEntity, MatchStatus } from '../../matches/types/match.entity';
import { CURRENT_SEASON_KICKOFFS } from '../cif.constants';
import { ResultsPageClient } from '../clients/results-page.client';
import { isPlayed, ScrapedMatch } from '../parsers/results.parser';
import { isSameTeam } from '../team-name';

const PENDING_STATUSES: MatchStatus[] = [MatchStatus.Scheduled, MatchStatus.Postponed];

@Injectable()
export class ResultsScrapperService {
  private readonly logger = new Logger(ResultsScrapperService.name);

  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly resultsPageClient: ResultsPageClient,
  ) {}

  async scrape(now: Date = new Date()): Promise<void> {
    const pendingJourneys = await this.findPendingJourneys();

    if (pendingJourneys.length === 0) {
      this.logger.log('All journeys already have results');
      return;
    }

    this.logger.log(`Checking journeys: ${pendingJourneys.join(', ')}`);

    for (const journey of pendingJourneys) {
      const scraped = await this.resultsPageClient.fetchJourney(journey);
      if (scraped === null) {
        return;
      }

      // A journey with no results at all hasn't been played yet, and neither have the
      // ones after it. A journey with some results is played, even if our match is not.
      if (!scraped.some(isPlayed)) {
        this.logger.log(`Journey ${journey} has no results on the website yet — stopping`);
        return;
      }

      await this.updateJourney(journey, scraped, now);
    }
  }

  private async findPendingJourneys(): Promise<number[]> {
    const pendingMatches = (
      await Promise.all(
        PENDING_STATUSES.map((status) =>
          this.matchRepository.findAll({ status, ...CURRENT_SEASON_KICKOFFS }),
        ),
      )
    ).flat();

    return [...new Set(pendingMatches.map((m) => m.journey))].sort((a, b) => a - b);
  }

  private async updateJourney(journey: number, scraped: ScrapedMatch[], now: Date): Promise<void> {
    const matches = await this.matchRepository.findAllWithTeams({
      journey,
      ...CURRENT_SEASON_KICKOFFS,
    });
    const pendingMatches = matches.filter((m) => PENDING_STATUSES.includes(m.status));

    for (const match of pendingMatches) {
      const source = scraped.find((s) => this.isSameFixture(match, s));
      if (!source) {
        this.logger.warn(
          `Journey ${journey}: ${match.homeTeam?.name} vs ${match.awayTeam?.name} not found on the website`,
        );
        continue;
      }

      const { homeTeamName, awayTeamName } = source;

      if (isPlayed(source)) {
        await this.matchRepository.update(match.id, {
          homeScore: source.homeScore,
          awayScore: source.awayScore,
          status: MatchStatus.Finished,
        });
        this.logger.log(
          `Updated journey ${journey}: ${homeTeamName} ${source.homeScore}-${source.awayScore} ${awayTeamName}`,
        );
        continue;
      }

      if (this.isOverdue(match, source, now)) {
        await this.matchRepository.update(match.id, { status: MatchStatus.Postponed });
        this.logger.warn(
          `Journey ${journey}: ${homeTeamName} vs ${awayTeamName} has no result — marked as postponed`,
        );
      }
    }
  }

  private isSameFixture(match: MatchEntity, scraped: ScrapedMatch): boolean {
    if (!match.homeTeam || !match.awayTeam) {
      return false;
    }
    return (
      isSameTeam(match.homeTeam.name, scraped.homeTeamName) &&
      isSameTeam(match.awayTeam.name, scraped.awayTeamName)
    );
  }

  /** The kickoff on the website has passed and there's still no result. */
  private isOverdue(match: MatchEntity, scraped: ScrapedMatch, now: Date): boolean {
    if (match.status !== MatchStatus.Scheduled || !scraped.kickoffAt) {
      return false;
    }
    return scraped.kickoffAt.getTime() < now.getTime();
  }
}
