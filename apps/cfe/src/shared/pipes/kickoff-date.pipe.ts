import { formatDate } from '@angular/common';
import { inject, LOCALE_ID, Pipe, PipeTransform } from '@angular/core';

/** Kickoff with weekday and time, e.g. "sábado, 19 de setembro, 18:50". */
@Pipe({
  name: 'kickoffDate',
})
export class KickoffDatePipe implements PipeTransform {
  private readonly locale = inject(LOCALE_ID);

  transform(kickoffAt: string | null | undefined): string {
    if (!kickoffAt || isNaN(Date.parse(kickoffAt))) {
      return 'Data a definir';
    }
    return formatDate(kickoffAt, "EEEE, d 'de' MMMM, HH:mm", this.locale);
  }
}
