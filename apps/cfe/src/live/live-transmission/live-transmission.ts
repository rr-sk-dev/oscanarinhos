import { Component, computed, inject } from '@angular/core';
import { SvgIcon, YoutubePlayer } from '@canarinhos/ngx-cui';
import { KickoffDatePipe } from '../../shared/pipes/kickoff-date.pipe';
import { MatchInfoPipe } from '../../shared/pipes/match-info.pipe';
import { ResultsService } from '../../results/results.service';
import { APP_CONSTANTS } from '../../shared/app.constants';
import { LiveStatus, liveStatus } from '../../shared/match-status';
import { injectNow } from '../../shared/now';

const STATUS_LABELS: Record<LiveStatus, string> = {
  live: 'EM DIRETO',
  soon: 'EM BREVE',
  upcoming: 'PRÓXIMO JOGO',
};

@Component({
  selector: 'app-live-transmission',
  imports: [SvgIcon, YoutubePlayer, KickoffDatePipe, MatchInfoPipe],
  templateUrl: './live-transmission.html',
  styleUrl: './live-transmission.css',
})
export class LiveTransmission {
  protected readonly liveTitle = `Transmissão em Direto - ${APP_CONSTANTS.teamName}`;
  protected readonly statusLabels = STATUS_LABELS;

  private resultsService = inject(ResultsService);
  // The status depends on the clock, so it must be re-evaluated while the page is open.
  private now = injectNow(30_000);

  protected loading = this.resultsService.upcomingLoading;
  protected error = this.resultsService.upcomingError;

  protected currentMatch = computed(() => this.resultsService.upcoming()[0] ?? null);

  protected videoId = computed<string | null>(() => {
    const upcomingVideo = this.currentMatch()?.videoId;
    if (upcomingVideo) {
      return upcomingVideo;
    }
    return this.resultsService.results().find((m) => m.videoId)?.videoId ?? null;
  });

  protected status = computed<LiveStatus>(() => {
    const match = this.currentMatch();
    return match ? liveStatus(match, this.now()) : 'upcoming';
  });
}
