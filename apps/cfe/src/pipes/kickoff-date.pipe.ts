import { Pipe, PipeTransform } from '@angular/core';
import { parseDate } from './parse-date';

/** Kickoff with weekday and time, e.g. "sábado, 19 de setembro, 18:50". */
@Pipe({
  name: 'kickoffDate',
})
export class KickoffDatePipe implements PipeTransform {
  transform(kickoffAt: string | null | undefined): string {
    const date = parseDate(kickoffAt);
    if (!date) {
      return 'Data a definir';
    }

    return date.toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
