import { DatePipe } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ErrorState, SvgIcon } from '@canarinhos/ngx-cui';
import { Match } from '@canarinhos/shared-types';
import { KickoffDatePipe } from '../../shared/pipes/kickoff-date.pipe';
import { MatchInfoPipe } from '../../shared/pipes/match-info.pipe';
import { TeamResultPipe } from '../../shared/pipes/team-result.pipe';
import { environment } from '../../environments/environment';
import { reloadWhile } from '../../shared/data-refresh';
import { liveStatus } from '../../shared/match-status';
import { injectNow } from '../../shared/now';
import { valueOr } from '../../shared/resource-value';
import { ResultBadgeClassPipe } from '../../shared/pipes/result-badge-class.pipe';
import { TeamService } from '../../team/team.service';

@Component({
  selector: 'app-match-detail',
  imports: [
    ErrorState,
    SvgIcon,
    KickoffDatePipe,
    MatchInfoPipe,
    TeamResultPipe,
    ResultBadgeClassPipe,
    DatePipe,
  ],
  templateUrl: './match-detail.html',
  styleUrl: './match-detail.css',
})
export class MatchDetail {
  /** Route param, bound by withComponentInputBinding. */
  readonly id = input.required<string>();

  private readonly baseUrl = environment.apiUrl;

  protected readonly ourTeamId = inject(TeamService).id;

  private matchResource = httpResource<Match>(() => `${this.baseUrl}/api/matches/${this.id()}`);

  protected match = valueOr(this.matchResource, undefined);
  protected loading = this.matchResource.isLoading;
  protected error = computed(() => (this.matchResource.error() ? 'Erro ao carregar jogo' : null));

  protected youtubeUrl = computed(() => {
    const videoId = this.match()?.videoId;
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  });

  private now = injectNow(60_000);
  private isLive = computed(() => {
    const match = this.match();
    return !!match && liveStatus(match, this.now()) === 'live';
  });

  constructor() {
    // Keep the score current while the match is being played.
    reloadWhile(this.isLive, 60_000, () => this.matchResource.reload());
  }

  protected retry(): void {
    this.matchResource.reload();
  }
}
