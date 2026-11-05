import { DatePipe } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState, SvgIcon } from '@canarinhos/ngx-cui';
import { Match } from '@canarinhos/shared-types';
import { MatchInfoPipe } from '../../shared/pipes/match-info.pipe';
import { TeamCrest } from '../../shared/team-crest/team-crest';
import { CountdownUnit } from '../countdown';

/** Home hero: the next match with its kickoff countdown, or the live score and a link to the stream. */
@Component({
  selector: 'app-next-match-card',
  imports: [DatePipe, RouterLink, ErrorState, SvgIcon, TeamCrest, MatchInfoPipe],
  templateUrl: './next-match-card.html',
  host: { class: 'block' },
})
export class NextMatchCard {
  match = input<Match | undefined>();
  loading = input(false);
  error = input<string | null>(null);
  isLive = input(false);
  countdown = input<CountdownUnit[] | null>(null);

  retry = output<void>();
}
