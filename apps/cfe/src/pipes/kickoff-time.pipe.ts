import { Pipe, PipeTransform } from '@angular/core';
import { parseDate } from './parse-date';

/** Kickoff time, e.g. "18:50". Empty for a missing or invalid date. */
@Pipe({
  name: 'kickoffTime',
})
export class KickoffTimePipe implements PipeTransform {
  transform(kickoffAt: string | null | undefined): string {
    const date = parseDate(kickoffAt);
    if (!date) {
      return '';
    }

    return date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
  }
}
