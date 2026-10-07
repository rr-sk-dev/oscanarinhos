import { Pipe, PipeTransform } from '@angular/core';
import { Match } from '@canarinhos/shared-types';
import { APP_CONSTANTS } from '../shared/app.constants';

/** Competition line, e.g. "Torneio CIF 2026/27 • Jornada 3". */
@Pipe({
  name: 'matchInfo',
})
export class MatchInfoPipe implements PipeTransform {
  transform(match: Match): string {
    const parts = [`Torneio CIF ${APP_CONSTANTS.season.label}`];
    if (match.journey) {
      parts.push(`Jornada ${match.journey}`);
    }
    return parts.join(' • ');
  }
}
