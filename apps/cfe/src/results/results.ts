import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { Match, MatchStatus } from '@canarinhos/shared-types';
import { KickoffTimePipe } from '../pipes/kickoff-time.pipe';
import { TeamResultPipe } from '../pipes/team-result.pipe';
import { APP_CONSTANTS } from '../shared/app.constants';
import { RESULT_BADGE_CLASSES } from '../shared/team-result';
import { TeamService } from '../team/team.service';
import { ResultsService } from './results.service';

export interface DateGroup {
  key: string;
  label: string;
  matches: Match[];
}

type TabType = 'proximos' | 'resultados';

/** Groups matches by their local calendar day, keeping the input order. */
export function groupByDate(matches: Match[]): DateGroup[] {
  const groups = new Map<string, DateGroup>();

  for (const match of matches) {
    const date = new Date(match.kickoffAt);
    // Local date parts: toISOString() is UTC and would file a late-night kickoff under the previous day.
    const key = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, '0'),
      String(date.getDate()).padStart(2, '0'),
    ].join('-');
    let group = groups.get(key);
    if (!group) {
      const label = date
        .toLocaleDateString('pt-PT', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
        .toUpperCase();
      group = { key, label, matches: [] };
      groups.set(key, group);
    }
    group.matches.push(match);
  }

  return Array.from(groups.values());
}

@Component({
  selector: 'app-results',
  imports: [NgTemplateOutlet, RouterLink, SvgIcon, KickoffTimePipe, TeamResultPipe],
  templateUrl: './results.html',
  styleUrl: './results.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Results {
  private resultsService = inject(ResultsService);

  protected readonly MatchStatus = MatchStatus;
  protected readonly seasonLabel = APP_CONSTANTS.season.label;
  protected readonly ourTeamId = inject(TeamService).id;
  protected readonly resultBadgeClasses = RESULT_BADGE_CLASSES;

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

  protected groupedByDate = computed(() =>
    groupByDate(
      this.activeTab() === 'proximos'
        ? this.resultsService.upcoming()
        : this.resultsService.results(),
    ),
  );

  protected emptyMessage = computed(() =>
    this.activeTab() === 'proximos' ? 'Sem jogos agendados' : 'Sem resultados disponíveis',
  );
}
