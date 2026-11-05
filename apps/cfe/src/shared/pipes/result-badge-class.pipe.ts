import { Pipe, PipeTransform } from '@angular/core';
import { TeamResult } from '@canarinhos/shared-types';

export type ResultClassVariant = 'badge' | 'stripe';

const RESULT_CLASSES: Record<ResultClassVariant, Record<TeamResult, string>> = {
  badge: {
    [TeamResult.WIN]: 'bg-cui-win-bg text-cui-win',
    [TeamResult.DRAW]: 'bg-cui-draw-bg text-cui-draw',
    [TeamResult.LOSS]: 'bg-cui-loss-bg text-cui-loss',
  },
  stripe: {
    [TeamResult.WIN]: 'bg-cui-win',
    [TeamResult.DRAW]: 'bg-cui-draw',
    [TeamResult.LOSS]: 'bg-cui-loss',
  },
};

/**
 * Colors for a result: a tinted badge (`[class]="result | resultBadgeClass"`) or a solid
 * stripe (`result | resultBadgeClass: 'stripe'`).
 */
@Pipe({
  name: 'resultBadgeClass',
})
export class ResultBadgeClassPipe implements PipeTransform {
  transform(result: TeamResult, variant: ResultClassVariant = 'badge'): string {
    return RESULT_CLASSES[variant][result];
  }
}
