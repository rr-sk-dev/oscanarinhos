import { Component, input } from '@angular/core';
import { Standing } from '@canarinhos/shared-types';
import { GoalDifferencePipe } from '../pipes/goal-difference.pipe';
import { TeamCrest } from '../team-crest/team-crest';

export interface StandingRow {
  standing: Standing;
  isOurTeam: boolean;
}

/** League table rows, with our team tinted and edged in yellow. */
@Component({
  selector: 'app-standings-table',
  imports: [TeamCrest, GoalDifferencePipe],
  templateUrl: './standings-table.html',
  host: { class: 'block overflow-x-auto rounded-[20px] border border-cui-line bg-cui-surface' },
})
export class StandingsTable {
  rows = input.required<StandingRow[]>();
  /** Adds the win, draw and loss columns. */
  detailed = input(false);
}
