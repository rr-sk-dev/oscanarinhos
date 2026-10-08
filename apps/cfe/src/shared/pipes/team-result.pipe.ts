import { Pipe, PipeTransform } from '@angular/core';
import { Match, TeamResult } from '@canarinhos/shared-types';
import { teamResult } from '../team-result';

/** Our result in a match: `match | teamResult: ourTeamId`. */
@Pipe({
  name: 'teamResult',
})
export class TeamResultPipe implements PipeTransform {
  transform(match: Match, ourTeamId: string | null | undefined): TeamResult | null {
    return teamResult(match, ourTeamId);
  }
}
