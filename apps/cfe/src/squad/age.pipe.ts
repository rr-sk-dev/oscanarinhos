import { Pipe, PipeTransform } from '@angular/core';

/**
 * Age in whole years on `today`, or null when the birth date is unknown. Birth dates are stored
 * as midnight UTC, so they are read in UTC to avoid landing on the previous day.
 */
@Pipe({
  name: 'age',
})
export class AgePipe implements PipeTransform {
  transform(birthDate: string | null | undefined, today: Date = new Date()): number | null {
    const date = birthDate ? new Date(birthDate) : null;
    if (!date || isNaN(date.getTime())) {
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
