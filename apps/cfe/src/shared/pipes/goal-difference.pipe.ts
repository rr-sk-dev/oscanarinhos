import { Pipe, PipeTransform } from '@angular/core';

/** Goal difference with an explicit sign, e.g. "+6", "0", "-3". */
@Pipe({
  name: 'goalDifference',
})
export class GoalDifferencePipe implements PipeTransform {
  transform(difference: number): string {
    return difference > 0 ? `+${difference}` : `${difference}`;
  }
}
