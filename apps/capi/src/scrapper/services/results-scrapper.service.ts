import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { MatchRepository } from '../../matches/matches.repository';
import { MatchStatus } from '../../matches/types/match.entity';

const RESULTS_BASE_URL = 'https://www.cif.org.pt/futebol/torneio-cif-2024-2025/resultados';

/**
 * HTML structure per match:
 *
 * <article class="games-list" data-game-id="...">
 *   <ul class="top-holder-result">
 *     <li><h1>Home Team</h1> ...</li>
 *     <li>
 *       <section>...</section>
 *       <div><h1>Home Score</h1></div>
 *       <div><span><h2>time</h2></span><span><h3>vs</h3></span></div>
 *       <div><h1>Away Score</h1></div>
 *     </li>
 *     <li><h1>Away Team</h1> ...</li>
 *   </ul>
 * </article>
 */

interface ScrapedResult {
  homeTeamName: string;
  awayTeamName: string;
  homeScore: number;
  awayScore: number;
}

@Injectable()
export class ResultsScrapperService {
  private readonly logger = new Logger(ResultsScrapperService.name);

  constructor(private readonly matchRepository: MatchRepository) {}

  async scrape(): Promise<void> {
    // Find all journeys that still have unplayed matches in the DB
    const scheduledMatches = await this.matchRepository.findAll({ status: MatchStatus.Scheduled });
    const pendingJourneys = [...new Set(scheduledMatches.map((m) => m.journey))].sort(
      (a, b) => a - b,
    );

    if (pendingJourneys.length === 0) {
      this.logger.log('All journeys already have results');
      return;
    }

    this.logger.log(`Checking journeys: ${pendingJourneys.join(', ')}`);

    for (const journey of pendingJourneys) {
      const updated = await this.scrapeJourney(journey);

      // If the website returned no scores, the journey hasn't been played yet —
      // all subsequent journeys will be the same, so stop early.
      if (updated === 0) {
        this.logger.log(`Journey ${journey} has no results on the website yet — stopping`);
        break;
      }
    }
  }

  private async scrapeJourney(journey: number): Promise<number> {
    const url = `${RESULTS_BASE_URL}/${journey}`;
    this.logger.log(`Fetching journey ${journey} from ${url}`);

    let html: string;
    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.error(`HTTP ${response.status} for journey ${journey}`);
        return 0;
      }
      html = await response.text();
    } catch (err) {
      this.logger.error(`Network error fetching journey ${journey}`, err);
      return 0;
    }

    const results = this.parseResults(html);
    if (results.length === 0) return 0;

    return this.updateMatches(journey, results);
  }

  private parseResults(html: string): ScrapedResult[] {
    const $ = cheerio.load(html);
    const results: ScrapedResult[] = [];

    $('article.games-list').each((_, article) => {
      const lis = $(article).find('ul.top-holder-result > li');
      if (lis.length < 3) return;

      const homeTeamName = $(lis[0]).find('h1').first().text().trim();
      const awayTeamName = $(lis[2]).find('h1').first().text().trim();

      // Middle li children: section, score-div, info-div, score-div
      const scoreDivs = $(lis[1]).find('div');
      const homeScore = parseInt($(scoreDivs[0]).find('h1').text().trim(), 10);
      const awayScore = parseInt($(scoreDivs[2]).find('h1').text().trim(), 10);

      if (!homeTeamName || !awayTeamName || isNaN(homeScore) || isNaN(awayScore)) return;

      results.push({ homeTeamName, awayTeamName, homeScore, awayScore });
    });

    return results;
  }

  private async updateMatches(journey: number, results: ScrapedResult[]): Promise<number> {
    const matches = await this.matchRepository.findAllWithTeams({ journey });
    let updated = 0;

    for (const result of results) {
      const match = matches.find(
        (m) =>
          m.homeTeam?.name.toLowerCase() === result.homeTeamName.toLowerCase() &&
          m.awayTeam?.name.toLowerCase() === result.awayTeamName.toLowerCase(),
      );

      if (!match) {
        this.logger.warn(
          `No DB match for journey ${journey}: ${result.homeTeamName} vs ${result.awayTeamName}`,
        );
        continue;
      }

      await this.matchRepository.update(match.id, {
        homeScore: result.homeScore,
        awayScore: result.awayScore,
        status: MatchStatus.Finished,
      });

      this.logger.log(
        `Updated journey ${journey}: ${result.homeTeamName} ${result.homeScore}-${result.awayScore} ${result.awayTeamName}`,
      );
      updated++;
    }

    return updated;
  }
}
