import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Modal, SvgIcon } from '@canarinhos/ngx-cui';
import { Standing } from '@canarinhos/shared-types';
import { NextMatchService } from './next-match.service';
import { StandingsService } from './standings.service';
import { TestimonialsService } from './testimonials.service';
import { countdownUnits } from './countdown';
import { STORE_ITEMS } from './store-items';
import { ResultsService } from '../results/results.service';
import { NewsService } from '../news/news.service';
import { TeamService } from '../team/team.service';
import { DateFormatPipe } from '../pipes/date-formatting.pipe';
import { KickoffDatePipe } from '../pipes/kickoff-date.pipe';
import { MatchInfoPipe } from '../pipes/match-info.pipe';
import { TeamResultPipe } from '../pipes/team-result.pipe';
import { APP_CONSTANTS } from '../shared/app.constants';
import { kickoffTime, liveStatus } from '../shared/match-status';
import { injectKickoffClock } from '../shared/now';
import { RESULT_BADGE_CLASSES } from '../shared/team-result';

interface StandingRow {
  standing: Standing;
  isOurTeam: boolean;
}

@Component({
  selector: 'app-home',
  imports: [
    SvgIcon,
    RouterLink,
    Modal,
    DateFormatPipe,
    KickoffDatePipe,
    MatchInfoPipe,
    TeamResultPipe,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  protected readonly resultBadgeClasses = RESULT_BADGE_CLASSES;

  // Testimonials
  protected testimonials = this.testimonialsService.testimonials;
  protected testimonialsLoading = this.testimonialsService.loading;

  // Next match
  protected loading = this.nextMatchService.loading;
  protected error = this.nextMatchService.error;
  protected nextGame = this.nextMatchService.match;

  // Recent results (last 5)
  protected recentResults = computed(() => this.resultsService.results().slice(0, 5));
  protected resultsLoading = this.resultsService.resultsLoading;

  // Latest news (3)
  protected latestNews = computed(() => this.newsService.articles().slice(0, 3));
  protected newsLoading = this.newsService.loading;

  // Standings
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

  // Live detection and countdown
  private kickoff = computed(() => kickoffTime(this.nextGame()));
  private now = injectKickoffClock(this.kickoff);
  protected isLive = computed(() => {
    const game = this.nextGame();
    return !!game && liveStatus(game, this.now()) === 'live';
  });
  protected countdown = computed(() => countdownUnits(this.kickoff(), this.now()));

  // Store modal
  protected storeModalOpen = signal(false);
  protected readonly storeItems = STORE_ITEMS;
}
