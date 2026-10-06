import { Pipe, PipeTransform } from '@angular/core';
import { parseDate } from './parse-date';

/** Long Portuguese date, e.g. "12 de maio de 2026". Empty for a missing or invalid date. */
@Pipe({
  name: 'formatDate',
})
export class DateFormatPipe implements PipeTransform {
  transform(value: Date | string | null | undefined): string {
    const date = parseDate(value);
    if (!date) {
      return '';
    }

    return date.toLocaleDateString('pt-PT', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
}
