import { DatePipe, formatDate, NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, linkedSignal, LOCALE_ID } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState, SvgIcon } from '@canarinhos/ngx-cui';
import { Match, MatchStatus } from '@canarinhos/shared-types';
import { APP_CONSTANTS } from '../shared/app.constants';
import { PageHeader } from '../shared/page-header/page-header';
import { ResultBadgeClassPipe } from '../shared/pipes/result-badge-class.pipe';
import { TeamResultPipe } from '../shared/pipes/team-result.pipe';
import { StandingsTable } from '../shared/standings-table/standings-table';
import { TeamCrest } from '../shared/team-crest/team-crest';
import { TeamService } from '../team/team.service';
import { LeagueTableService } from './league-table.service';
import { ResultsService } from './results.service';

export interface MonthGroup {
  key: string;
  label: string;
  matches: Match[];
}

export type ResultsTab = 'proximos' | 'resultados' | 'tabela';

interface TabItem {
  id: ResultsTab;
  label: string;
}

const TABS: TabItem[] = [
  { id: 'proximos', label: 'Próximos' },
  { id: 'resultados', label: 'Resultados' },
  { id: 'tabela', label: 'Classificação' },
];

/** Groups matches by their local calendar month, keeping the input order. */
export function groupByMonth(matches: Match[], locale: string): MonthGroup[] {
  const groups = new Map<string, MonthGroup>();

  for (const match of matches) {
    const date = new Date(match.kickoffAt);
    // Local date parts: toISOString() is UTC and would file a late-night kickoff under the previous day.
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, label: formatDate(date, "MMMM 'de' y", locale), matches: [] };
      groups.set(key, group);
    }
    group.matches.push(match);
  }

  return Array.from(groups.values());
}

/** Jogos: upcoming matches, results and the league table, under three tabs. */
@Component({
  selector: 'app-results',
  imports: [
    DatePipe,
    ErrorState,
    NgTemplateOutlet,
    PageHeader,
    ResultBadgeClassPipe,
    RouterLink,
    StandingsTable,
    SvgIcon,
    TeamCrest,
    TeamResultPipe,
  ],
  templateUrl: './results.html',
  host: { class: 'block' },
})
export class Results {
  private resultsService = inject(ResultsService);
  private leagueTable = inject(LeagueTableService);
  private readonly locale = inject(LOCALE_ID);

  /** Query param (`?tab=tabela`), bound by withComponentInputBinding. */
  readonly tab = input<string>();

  protected readonly tabs = TABS;
  protected readonly finished = MatchStatus.FINISHED;
  protected readonly subtitle = `Torneio CIF · Época ${APP_CONSTANTS.season.label}`;
  protected readonly ourTeamId = inject(TeamService).id;

  protected activeTab = linkedSignal<ResultsTab>(
    () => TABS.find((tab) => tab.id === this.tab())?.id ?? 'proximos',
  );

  protected upcomingGroups = computed(() =>
    groupByMonth(this.resultsService.upcoming(), this.locale),
  );
  protected upcomingLoading = this.resultsService.upcomingLoading;
  protected upcomingError = this.resultsService.upcomingError;
  protected nextMatchId = computed(() => this.resultsService.upcoming()[0]?.id ?? null);

  protected resultGroups = computed(() => groupByMonth(this.resultsService.results(), this.locale));
  protected resultsLoading = this.resultsService.resultsLoading;
  protected resultsError = this.resultsService.resultsError;

  protected tableRows = this.leagueTable.rows;
  protected ourStanding = this.leagueTable.ourStanding;
  protected tableLoading = this.leagueTable.loading;
  protected tableError = this.leagueTable.error;

  protected select(tab: ResultsTab): void {
    this.activeTab.set(tab);
  }

  /** Arrow keys move between tabs, as the ARIA tabs pattern expects. */
  protected onTabKeydown(event: KeyboardEvent, index: number): void {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) {
      return;
    }
    event.preventDefault();
    const next = TABS[(index + step + TABS.length) % TABS.length];
    this.select(next.id);
    (event.currentTarget as HTMLElement).parentElement
      ?.querySelector<HTMLElement>(`#tab-${next.id}`)
      ?.focus();
  }

  protected retryUpcoming(): void {
    this.resultsService.reloadUpcoming();
  }

  protected retryResults(): void {
    this.resultsService.reloadResults();
  }

  protected retryTable(): void {
    this.leagueTable.reload();
  }
}
