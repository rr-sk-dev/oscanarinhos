import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState, SvgIcon } from '@canarinhos/ngx-cui';
import { Match } from '@canarinhos/shared-types';
import { KickoffDatePipe } from '../../shared/pipes/kickoff-date.pipe';
import { MatchInfoPipe } from '../../shared/pipes/match-info.pipe';
import { TeamCrest } from '../../shared/team-crest/team-crest';
import { CountdownUnit } from '../countdown';

/** The next match: teams, kickoff countdown or live score, and a link to the stream. */
@Component({
  selector: 'app-next-match-card',
  imports: [RouterLink, ErrorState, SvgIcon, TeamCrest, KickoffDatePipe, MatchInfoPipe],
  templateUrl: './next-match-card.html',
  styleUrl: './next-match-card.css',
})
export class NextMatchCard {
  match = input<Match | undefined>();
  loading = input(false);
  error = input<string | null>(null);
  isLive = input(false);
  countdown = input<CountdownUnit[] | null>(null);

  retry = output<void>();
}
