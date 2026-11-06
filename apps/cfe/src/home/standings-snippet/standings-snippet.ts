import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StandingRow, StandingsTable } from '../../shared/standings-table/standings-table';

/** Our position in the table, with the teams just above and below. */
@Component({
  selector: 'app-standings-snippet',
  imports: [RouterLink, StandingsTable],
  templateUrl: './standings-snippet.html',
})
export class StandingsSnippet {
  rows = input.required<StandingRow[]>();
  loading = input(false);
}
