import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { HeroSection, SvgIcon } from '@canarinhos/ngx-cui';
import { Match, MatchStatus } from '@canarinhos/shared-types';
import { APP_CONSTANTS } from '../shared/app.constants';
import { MatchUtilsService } from '../shared/match-utils.service';
import { TeamService } from '../team/team.service';
import { ResultsService } from './results.service';

interface DateGroup {
  key: string;
  label: string;
  matches: Match[];
}

type TabType = 'proximos' | 'resultados';

@Component({
  selector: 'app-results',
  imports: [HeroSection, SvgIcon],
  templateUrl: './results.html',
  styleUrl: './results.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  private resultsService = inject(ResultsService);
  protected matchUtils = inject(MatchUtilsService);
  protected teamSlug = APP_CONSTANTS.teamSlug;
  protected teamPhoto = inject(TeamService).teamPhoto;

  protected activeTab = signal<TabType>('resultados');

  protected loading = computed(() =>
    this.activeTab() === 'proximos'
      ? this.resultsService.upcomingLoading()
      : this.resultsService.resultsLoading(),
  );

  protected error = computed(() =>
    this.activeTab() === 'proximos'
      ? this.resultsService.upcomingError()
      : this.resultsService.resultsError(),
  );

  protected displayedMatches = computed(() =>
    this.activeTab() === 'proximos'
      ? this.resultsService.upcoming()
      : this.resultsService.results(),
  );

  protected groupedByDate = computed<DateGroup[]>(() => {
    const matches = this.displayedMatches();
    const groups = new Map<string, DateGroup>();

    for (const match of matches) {
      const date = new Date(match.kickoffAt);
      const key = date.toISOString().slice(0, 10);
      if (!groups.has(key)) {
        const label = date
          .toLocaleDateString('pt-PT', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })
          .toUpperCase();
        groups.set(key, { key, label, matches: [] });
      }
      groups.get(key)!.matches.push(match);
    }

    return Array.from(groups.values());
  });

  switchTab(tab: TabType): void {
    this.activeTab.set(tab);
  }

  isTabActive(tab: TabType): boolean {
    return this.activeTab() === tab;
  }

  getMatchRound(journey: number | null | undefined): string {
    return journey ? `Jornada ${journey}` : '';
  }

  getEmptyMessage(): string {
    return this.activeTab() === 'proximos' ? 'Sem jogos agendados' : 'Sem resultados disponíveis';
  }

  isFinished(match: Match): boolean {
    return match.status === MatchStatus.FINISHED;
  }

  openVideo(event: MouseEvent, videoId: string | null): void {
    event.stopPropagation();
    if (videoId) {
      window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank', 'noopener,noreferrer');
    }
  }
}
