import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Match } from '@canarinhos/shared-types';
import { ResultBadgeClassPipe } from '../../shared/pipes/result-badge-class.pipe';
import { TeamResultPipe } from '../../shared/pipes/team-result.pipe';
import { TeamCrest } from '../../shared/team-crest/team-crest';

/** Horizontal strip of the latest results, each linking to its match page. */
@Component({
  selector: 'app-recent-results',
  imports: [RouterLink, TeamCrest, TeamResultPipe, ResultBadgeClassPipe],
  templateUrl: './recent-results.html',
  styleUrl: './recent-results.css',
})
export class RecentResults {
  matches = input.required<Match[]>();
  loading = input(false);
  ourTeamId = input<string | null>(null);
}
