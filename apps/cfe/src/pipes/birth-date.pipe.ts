import { Pipe, PipeTransform } from '@angular/core';
import { parseDate } from './parse-date';

/**
 * Birth date as "dd/mm/yyyy", or "—" when unknown. Birth dates are stored as midnight UTC,
 * so they are read in UTC to avoid showing the previous day west of Greenwich.
 */
@Pipe({
  name: 'birthDate',
})
export class BirthDatePipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    const date = parseDate(value);
    if (!date) {
      return '—';
    }

    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}/${date.getUTCFullYear()}`;
  }
}
