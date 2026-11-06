import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, linkedSignal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ErrorState, SvgIcon, YoutubePlayer } from '@canarinhos/ngx-cui';
import { Match, MatchStatus } from '@canarinhos/shared-types';
import { MatchInfoPipe } from '../../shared/pipes/match-info.pipe';
import { TeamResultPipe } from '../../shared/pipes/team-result.pipe';
import { injectPageTitle } from '../../app/app-title.strategy';
import { environment } from '../../environments/environment';
import { reloadWhile } from '../../shared/data-refresh';
import { liveStatus } from '../../shared/match-status';
import { injectNow } from '../../shared/now';
import { valueOr } from '../../shared/resource-value';
import { ResultBadgeClassPipe } from '../../shared/pipes/result-badge-class.pipe';
import { TeamCrest } from '../../shared/team-crest/team-crest';
import { TeamService } from '../../team/team.service';

type MatchSection = 'video' | 'details';

const SECTIONS: { id: MatchSection; label: string }[] = [
  { id: 'video', label: 'Vídeo' },
  { id: 'details', label: 'Detalhes' },
];

/** A match: score header, then its video or its details. */
@Component({
  selector: 'app-match-detail',
  imports: [
    TeamCrest,
    ErrorState,
    SvgIcon,
    YoutubePlayer,
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
  protected readonly finished = MatchStatus.FINISHED;
  protected readonly sections = SECTIONS;

  private matchResource = httpResource<Match>(() => `${this.baseUrl}/api/matches/${this.id()}`);

  protected match = valueOr(this.matchResource, undefined);
  protected loading = this.matchResource.isLoading;
  protected error = computed(() => (this.matchResource.error() ? 'Erro ao carregar jogo' : null));

  protected youtubeUrl = computed(() => {
    const videoId = this.match()?.videoId;
    return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
  });

  protected videoTitle = computed(() => {
    const match = this.match();
    return `${match?.homeTeam?.name ?? 'Casa'} contra ${match?.awayTeam?.name ?? 'Fora'}`;
  });

  /** Opens on the video when there is one. */
  protected activeSection = linkedSignal<MatchSection>(() =>
    this.match()?.videoId ? 'video' : 'details',
  );

  private now = injectNow(60_000);
  protected isLive = computed(() => {
    const match = this.match();
    return !!match && liveStatus(match, this.now()) === 'live';
  });

  constructor() {
    injectPageTitle(
      computed(() => {
        const match = this.match();
        return (
          match && `${match.homeTeam?.name ?? 'Casa'} contra ${match.awayTeam?.name ?? 'Fora'}`
        );
      }),
    );
    // Keep the score current while the match is being played.
    reloadWhile(this.isLive, 60_000, () => this.matchResource.reload());
  }

  protected retry(): void {
    this.matchResource.reload();
  }
}
