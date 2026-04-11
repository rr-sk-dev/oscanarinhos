import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { Match } from '@canarinhos/shared-types';
import { MatchUtilsService } from '../../shared/match-utils.service';
import { environment } from '../../environments/environment';
import { APP_CONSTANTS } from '../../shared/app.constants';

@Component({
  selector: 'app-match-detail',
  imports: [SvgIcon],
  templateUrl: './match-detail.html',
  styleUrl: './match-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MatchDetail {
  private route = inject(ActivatedRoute);
  protected matchUtils = inject(MatchUtilsService);
  protected teamSlug = APP_CONSTANTS.teamSlug;
  private readonly baseUrl = environment.apiUrl;

  private matchId = this.route.snapshot.params['id'] as string | undefined;

  private matchResource = httpResource<Match>(
    () => (this.matchId ? `${this.baseUrl}/api/matches/${this.matchId}` : undefined),
  );

  protected match = this.matchResource.value;
  protected loading = this.matchResource.isLoading;
  protected error = computed(() => {
    if (!this.matchId) return 'Jogo não encontrado';
    const err = this.matchResource.error();
    return err ? 'Erro ao carregar jogo' : null;
  });

  protected youtubeUrl = computed(() => {
    const m = this.match();
    return m?.videoId ? `https://www.youtube.com/watch?v=${m.videoId}` : null;
  });

  protected openYoutube(): void {
    const url = this.youtubeUrl();
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  }
}
