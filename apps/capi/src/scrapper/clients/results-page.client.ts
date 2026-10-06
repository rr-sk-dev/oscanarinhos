import { Injectable, Logger } from '@nestjs/common';
import { CIF_RESULTS_URL } from '../cif.constants';
import { parseResultsPage, ScrapedMatch } from '../parsers/results.parser';

/** Fetches and parses one journey page of cif.org.pt results. */
@Injectable()
export class ResultsPageClient {
  private readonly logger = new Logger(ResultsPageClient.name);

  /** Returns null when the page can't be fetched. */
  async fetchJourney(journey: number): Promise<ScrapedMatch[] | null> {
    const url = `${CIF_RESULTS_URL}/${journey}`;
    this.logger.log(`Fetching journey ${journey} from ${url}`);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        this.logger.error(`HTTP ${response.status} for journey ${journey}`);
        return null;
      }
      return parseResultsPage(await response.text());
    } catch (err) {
      this.logger.error(`Network error fetching journey ${journey}`, err);
      return null;
    }
  }
}
