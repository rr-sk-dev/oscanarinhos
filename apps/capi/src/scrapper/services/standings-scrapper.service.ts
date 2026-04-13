import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { StandingsRepository } from '../../standings/standings.repository';
import { CreateStandingData } from '../../standings/types/standing.entity';

const STANDINGS_URL = 'https://www.cif.org.pt/futebol/torneio-cif-2024-2025/classificacao';
const CURRENT_SEASON = '2024-2025';

/**
 * Table: #tabela-classificacao.global-table
 * Columns (0-indexed):
 *   0  #        → position
 *   1  Equipa   → teamName
 *   2  Pts      → points
 *   3  Jgs      → gamesPlayed
 *   4  V        → wins
 *   5  E        → draws
 *   6  D        → losses
 *   7  FC       → (skip — fair play / cards)
 *   8  GM       → goalsFor
 *   9  GS       → goalsAgainst
 *   10 DIF. G   → goalDifference
 *   11 TD       → (skip)
 */

interface ScrapedStanding {
  position: number;
  teamName: string;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

@Injectable()
export class StandingsScrapperService {
  private readonly logger = new Logger(StandingsScrapperService.name);

  constructor(private readonly standingsRepository: StandingsRepository) {}

  async scrape(): Promise<void> {
    this.logger.log(`Fetching standings from ${STANDINGS_URL}`);

    let html: string;
    try {
      const response = await fetch(STANDINGS_URL);
      if (!response.ok) {
        this.logger.error(`Failed to fetch standings page: HTTP ${response.status}`);
        return;
      }
      html = await response.text();
    } catch (err) {
      this.logger.error('Network error while fetching standings', err);
      return;
    }

    const standings = this.parseStandings(html);
    if (standings.length === 0) {
      this.logger.warn('No standings parsed from page');
      return;
    }

    this.logger.log(`Parsed ${standings.length} standing(s) from page`);
    await this.upsertStandings(standings);
  }

  private parseStandings(html: string): ScrapedStanding[] {
    const $ = cheerio.load(html);
    const standings: ScrapedStanding[] = [];

    $('#tabela-classificacao tbody tr, #tabela-classificacao tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 11) return;

      const position = parseInt($(cells[0]).text().trim(), 10);
      const teamName = $(cells[1]).text().trim();
      const points = parseInt($(cells[2]).text().trim(), 10);
      const gamesPlayed = parseInt($(cells[3]).text().trim(), 10);
      const wins = parseInt($(cells[4]).text().trim(), 10);
      const draws = parseInt($(cells[5]).text().trim(), 10);
      const losses = parseInt($(cells[6]).text().trim(), 10);
      // col 7 = FC (skip)
      const goalsFor = parseInt($(cells[8]).text().trim(), 10);
      const goalsAgainst = parseInt($(cells[9]).text().trim(), 10);
      const goalDifference = parseInt($(cells[10]).text().trim(), 10);

      if (!teamName || isNaN(position) || isNaN(points)) return;

      standings.push({
        position,
        teamName,
        points,
        gamesPlayed: isNaN(gamesPlayed) ? 0 : gamesPlayed,
        wins: isNaN(wins) ? 0 : wins,
        draws: isNaN(draws) ? 0 : draws,
        losses: isNaN(losses) ? 0 : losses,
        goalsFor: isNaN(goalsFor) ? 0 : goalsFor,
        goalsAgainst: isNaN(goalsAgainst) ? 0 : goalsAgainst,
        goalDifference: isNaN(goalDifference) ? 0 : goalDifference,
      });
    });

    return standings;
  }

  private async upsertStandings(standings: ScrapedStanding[]): Promise<void> {
    const deleted = await this.standingsRepository.deleteBySeason(CURRENT_SEASON);
    this.logger.log(`Cleared ${deleted} existing standings for ${CURRENT_SEASON}`);

    for (const standing of standings) {
      const data: CreateStandingData = {
        season: CURRENT_SEASON,
        teamLogo: null,
        ...standing,
      };
      await this.standingsRepository.create(data);
    }

    this.logger.log(`Inserted ${standings.length} standings for ${CURRENT_SEASON}`);
  }
}
