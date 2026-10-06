import { Pipe, PipeTransform } from '@angular/core';
import { parseDate } from './parse-date';

/** Age in whole years on `today`, or null when the birth date is unknown. */
@Pipe({
  name: 'age',
})
export class AgePipe implements PipeTransform {
  transform(birthDate: string | null | undefined, today: Date = new Date()): number | null {
    const date = parseDate(birthDate);
    if (!date) {
      return null;
    }

    let age = today.getFullYear() - date.getUTCFullYear();
    const monthDiff = today.getMonth() - date.getUTCMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getUTCDate())) {
      age--;
    }
    return age;
  }
}
