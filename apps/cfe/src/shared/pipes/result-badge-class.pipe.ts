import { Pipe, PipeTransform } from '@angular/core';
import { TeamResult } from '@canarinhos/shared-types';

const RESULT_BADGE_CLASSES: Record<TeamResult, string> = {
  [TeamResult.WIN]: 'bg-cui-win-bg text-cui-win',
  [TeamResult.DRAW]: 'bg-cui-draw-bg text-cui-draw',
  [TeamResult.LOSS]: 'bg-cui-loss-bg text-cui-loss',
};

/** Badge colors for a result: `[class]="result | resultBadgeClass"`. */
@Pipe({
  name: 'resultBadgeClass',
})
export class ResultBadgeClassPipe implements PipeTransform {
  transform(result: TeamResult): string {
    return RESULT_BADGE_CLASSES[result];
  }
}
