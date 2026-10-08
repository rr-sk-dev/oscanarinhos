import { Component, input } from '@angular/core';
import { SvgIcon } from '@canarinhos/ngx-cui';
import { Standing } from '@canarinhos/shared-types';
import { TeamCrest } from '../../shared/team-crest/team-crest';

export interface StandingRow {
  standing: Standing;
  isOurTeam: boolean;
}

/** Our position in the table, with the teams just above and below. */
@Component({
  selector: 'app-standings-snippet',
  imports: [SvgIcon, TeamCrest],
  templateUrl: './standings-snippet.html',
})
export class StandingsSnippet {
  rows = input.required<StandingRow[]>();
  loading = input(false);
}
