import { DatePipe, formatDate } from '@angular/common';
import { Component, computed, inject, LOCALE_ID, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState, SvgIcon } from '@canarinhos/ngx-cui';
import { Match, MatchStatus } from '@canarinhos/shared-types';
import { TeamResultPipe } from '../shared/pipes/team-result.pipe';
import { APP_CONSTANTS } from '../shared/app.constants';
import { ResultBadgeClassPipe } from '../shared/pipes/result-badge-class.pipe';
import { TeamCrest } from '../shared/team-crest/team-crest';
import { TeamService } from '../team/team.service';
import { ResultsService } from './results.service';

export interface DateGroup {
  key: string;
  label: string;
  matches: Match[];
}

type TabType = 'proximos' | 'resultados';

/** Groups matches by their local calendar day, keeping the input order. */
export function groupByDate(matches: Match[], locale: string): DateGroup[] {
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
      const label = formatDate(date, "EEEE, d 'de' MMMM 'de' y", locale).toUpperCase();
      group = { key, label, matches: [] };
      groups.set(key, group);
    }
    group.matches.push(match);
  }

  return Array.from(groups.values());
}

@Component({
  selector: 'app-results',
  imports: [
    ErrorState,
    TeamCrest,
    RouterLink,
    SvgIcon,
    DatePipe,
    TeamResultPipe,
    ResultBadgeClassPipe,
  ],
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class Results {
  private resultsService = inject(ResultsService);
  private readonly locale = inject(LOCALE_ID);

  protected readonly finished = MatchStatus.FINISHED;
  protected readonly seasonLabel = APP_CONSTANTS.season.label;
  protected readonly ourTeamId = inject(TeamService).id;

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
      this.locale,
    ),
  );

  protected retry(): void {
    if (this.activeTab() === 'proximos') {
      this.resultsService.reloadUpcoming();
    } else {
      this.resultsService.reloadResults();
    }
  }

  protected emptyMessage = computed(() =>
    this.activeTab() === 'proximos' ? 'Sem jogos agendados' : 'Sem resultados disponíveis',
  );
}
