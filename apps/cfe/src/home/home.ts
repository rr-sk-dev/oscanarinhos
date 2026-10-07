import { NgOptimizedImage } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { NewsService } from '../news/news.service';
import { ResultsService } from '../results/results.service';
import { APP_CONSTANTS } from '../shared/app.constants';
import { reloadWhile } from '../shared/data-refresh';
import { kickoffTime, liveStatus } from '../shared/match-status';
import { injectKickoffClock } from '../shared/now';
import { TeamService } from '../team/team.service';
import { countdownUnits } from './countdown';
import { LatestNews } from './latest-news/latest-news';
import { NextMatchCard } from './next-match-card/next-match-card';
import { NextMatchService } from './next-match.service';
import { RecentResults } from './recent-results/recent-results';
import { StandingRow, StandingsSnippet } from './standings-snippet/standings-snippet';
import { StandingsService } from './standings.service';
import { StorePreview } from './store-preview/store-preview';
import { TestimonialsCarousel } from './testimonials-carousel/testimonials-carousel';
import { TestimonialsService } from './testimonials.service';

const LIVE_REFRESH_MS = 60_000;

/** Home page container: loads the data and hands it to presentational sections. */
@Component({
  selector: 'app-home',
  imports: [
    NgOptimizedImage,
    NextMatchCard,
    RecentResults,
    LatestNews,
    StandingsSnippet,
    TestimonialsCarousel,
    StorePreview,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private nextMatchService = inject(NextMatchService);
  private standingsService = inject(StandingsService);
  private resultsService = inject(ResultsService);
  private newsService = inject(NewsService);
  private testimonialsService = inject(TestimonialsService);

  protected readonly teamName = APP_CONSTANTS.teamName;
  protected readonly teamSubtitle = APP_CONSTANTS.teamSubtitle;
  protected readonly ourTeamId = inject(TeamService).id;

  // Next match
  protected nextMatch = this.nextMatchService.match;
  protected nextMatchLoading = this.nextMatchService.loading;
  protected nextMatchError = this.nextMatchService.error;

  // Live detection and countdown
  private kickoff = computed(() => kickoffTime(this.nextMatch()));
  private now = injectKickoffClock(this.kickoff);
  protected isLive = computed(() => {
    const match = this.nextMatch();
    return !!match && liveStatus(match, this.now()) === 'live';
  });
  protected countdown = computed(() => countdownUnits(this.kickoff(), this.now()));

  // Sections
  protected recentResults = computed(() => this.resultsService.results().slice(0, 5));
  protected resultsLoading = this.resultsService.resultsLoading;
  protected latestNews = computed(() => this.newsService.articles().slice(0, 3));
  protected newsLoading = this.newsService.loading;
  protected testimonials = this.testimonialsService.testimonials;
  protected testimonialsLoading = this.testimonialsService.loading;
  protected standingsLoading = this.standingsService.loading;
  protected standingRows = computed<StandingRow[]>(() => {
    const context = this.standingsService.context();
    if (!context) {
      return [];
    }
    const rows: StandingRow[] = [];
    if (context.above) {
      rows.push({ standing: context.above, isOurTeam: false });
    }
    rows.push({ standing: context.team, isOurTeam: true });
    if (context.below) {
      rows.push({ standing: context.below, isOurTeam: false });
    }
    return rows;
  });

  constructor() {
    // Keep the score and results current while the match is being played.
    reloadWhile(this.isLive, LIVE_REFRESH_MS, () => {
      this.nextMatchService.reload();
      this.resultsService.reloadResults();
    });
  }

  protected retryNextMatch(): void {
    this.nextMatchService.reload();
  }
}
