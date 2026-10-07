import { Component, computed, inject, input } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { Match } from '@canarinhos/shared-types';
import { KickoffDatePipe } from '../../pipes/kickoff-date.pipe';
import { KickoffTimePipe } from '../../pipes/kickoff-time.pipe';
import { MatchInfoPipe } from '../../pipes/match-info.pipe';
import { TeamResultPipe } from '../../pipes/team-result.pipe';
import { environment } from '../../environments/environment';
import { valueOr } from '../../shared/resource-value';
import { ResultBadgeClassPipe } from '../../pipes/result-badge-class.pipe';
import { TeamService } from '../../team/team.service';

@Component({
  selector: 'app-match-detail',
  imports: [
    SvgIcon,
    KickoffDatePipe,
    KickoffTimePipe,
    MatchInfoPipe,
    TeamResultPipe,
    ResultBadgeClassPipe,
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
}
