import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { ScorersRepository } from '../../scorers/scorers.repository';
import { CreateScorerData } from '../../scorers/types/scorer.entity';

const SCORERS_URL = 'https://www.cif.org.pt/futebol/torneio-cif-2024-2025/marcadores';
const CURRENT_SEASON = '2024-2025';

/**
 * Table: #tabela-marcadores.global-table
 * Columns (0-indexed):
 *   0  #          → rank
 *   1  Jogador    → playerName
 *   2  Equipa     → teamName
 *   3  Jornada X  → goals in last journey (skip)
 *   4  Total      → goals (season total)
 */

interface ScrapedScorer {
  rank: number;
  playerName: string;
  teamName: string;
  goals: number;
}

@Injectable()
export class ScorersScrapperService {
  private readonly logger = new Logger(ScorersScrapperService.name);

  constructor(private readonly scorersRepository: ScorersRepository) {}

  async scrape(): Promise<void> {
    this.logger.log(`Fetching scorers from ${SCORERS_URL}`);

    let html: string;
    try {
      const response = await fetch(SCORERS_URL);
      if (!response.ok) {
        this.logger.error(`Failed to fetch scorers page: HTTP ${response.status}`);
        return;
      }
      html = await response.text();
    } catch (err) {
      this.logger.error('Network error while fetching scorers', err);
      return;
    }

    const scorers = this.parseScorers(html);
    if (scorers.length === 0) {
      this.logger.warn('No scorers parsed from page');
      return;
    }

    this.logger.log(`Parsed ${scorers.length} scorer(s) from page`);
    await this.upsertScorers(scorers);
  }

  private parseScorers(html: string): ScrapedScorer[] {
    const $ = cheerio.load(html);
    const scorers: ScrapedScorer[] = [];

    $('#tabela-marcadores tbody tr, #tabela-marcadores tr').each((_, row) => {
      const cells = $(row).find('td');
      if (cells.length < 5) return;

      const rank = parseInt($(cells[0]).text().trim(), 10);
      const playerName = $(cells[1]).text().trim();
      const teamName = $(cells[2]).text().trim();
      // col 3 = goals in last journey (skip)
      const goals = parseInt($(cells[4]).text().trim(), 10);

      if (!playerName || !teamName || isNaN(rank) || isNaN(goals)) return;

      scorers.push({ rank, playerName, teamName, goals });
    });

    return scorers;
  }

  private async upsertScorers(scorers: ScrapedScorer[]): Promise<void> {
    const deleted = await this.scorersRepository.deleteBySeason(CURRENT_SEASON);
    this.logger.log(`Cleared ${deleted} existing scorers for ${CURRENT_SEASON}`);

    for (const scorer of scorers) {
      const data: CreateScorerData = {
        season: CURRENT_SEASON,
        ...scorer,
      };
      await this.scorersRepository.create(data);
    }

    this.logger.log(`Inserted ${scorers.length} scorers for ${CURRENT_SEASON}`);
  }
}
