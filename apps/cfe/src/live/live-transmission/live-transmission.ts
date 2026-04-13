import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { SvgIcon, YoutubePlayer } from '@canarinhos/ngx-cui';
import { ResultsService } from '../../results/results.service';
import { APP_CONSTANTS } from '../../shared/app.constants';
import { MatchUtilsService } from '../../shared/match-utils.service';

@Component({
  selector: 'app-live-transmission',
  imports: [SvgIcon, YoutubePlayer],
  templateUrl: './live-transmission.html',
  styleUrl: './live-transmission.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LiveTransmission {
  protected readonly teamName = APP_CONSTANTS.teamName;
  protected readonly liveTitle = `Transmissão em Direto - ${APP_CONSTANTS.teamName}`;

  private resultsService = inject(ResultsService);
  protected matchUtils = inject(MatchUtilsService);

  protected loading = this.resultsService.upcomingLoading;
  protected error = this.resultsService.upcomingError;

  protected currentMatch = computed(() => {
    const upcoming = this.resultsService.upcoming();
    return upcoming.length > 0 ? upcoming[0] : null;
  });

  protected videoId = computed<string | null>(() => {
    const upcoming = this.currentMatch();
    if (upcoming?.videoId) return upcoming.videoId;

    return this.resultsService.results()?.find((m) => m.videoId)?.videoId ?? null;
  });

  protected isLive = computed(() => {
    const match = this.currentMatch();
    if (!match?.kickoffAt) return false;

    const now = new Date();
    const kickoff = new Date(match.kickoffAt);
    if (isNaN(kickoff.getTime())) return false;

    const twoHoursAfter = new Date(kickoff.getTime() + 2 * 60 * 60 * 1000);
    return now >= kickoff && now <= twoHoursAfter;
  });

  protected matchStatus = computed(() => {
    const match = this.currentMatch();
    if (!match?.kickoffAt) return 'PRÓXIMO JOGO';

    const now = new Date();
    const kickoff = new Date(match.kickoffAt);
    if (isNaN(kickoff.getTime())) return 'PRÓXIMO JOGO';

    const twoHoursAfter = new Date(kickoff.getTime() + 2 * 60 * 60 * 1000);
    const twoHoursBefore = new Date(kickoff.getTime() - 2 * 60 * 60 * 1000);

    if (now >= kickoff && now <= twoHoursAfter) return 'EM DIRETO';
    if (now >= twoHoursBefore && now < kickoff) return 'EM BREVE';
    return 'PRÓXIMO JOGO';
  });
}
