import { Component, computed, input } from '@angular/core';
import { Match, Standing, TeamResult } from '@canarinhos/shared-types';
import { ResultBadgeClassPipe } from '../../shared/pipes/result-badge-class.pipe';
import { teamResult } from '../../shared/team-result';

const FORM_LENGTH = 5;

const RESULT_LETTERS: Record<TeamResult, string> = {
  [TeamResult.WIN]: 'V',
  [TeamResult.DRAW]: 'E',
  [TeamResult.LOSS]: 'D',
};

interface FormEntry {
  id: string;
  result: TeamResult;
  letter: string;
}

/** Our table position and the results of our last five matches, oldest first. */
@Component({
  selector: 'app-form-card',
  imports: [ResultBadgeClassPipe],
  templateUrl: './form-card.html',
  host: { class: 'block' },
})
export class FormCard {
  /** Finished matches, newest first. */
  matches = input.required<Match[]>();
  ourTeamId = input<string | null>(null);
  standing = input<Standing | undefined>();
  loading = input(false);

  protected form = computed<FormEntry[]>(() =>
    this.matches()
      .slice(0, FORM_LENGTH)
      .flatMap((match) => {
        const result = teamResult(match, this.ourTeamId());
        return result ? [{ id: match.id, result, letter: RESULT_LETTERS[result] }] : [];
      })
      .reverse(),
  );
}
