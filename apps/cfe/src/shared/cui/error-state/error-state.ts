import { Component, input, output } from '@angular/core';

/** Error box with an optional "try again" button. */
@Component({
  selector: 'cui-error-state',
  templateUrl: './error-state.html',
})
export class ErrorState {
  message = input.required<string>();
  /** Shows the retry button. Off for errors a retry cannot fix, such as "not found". */
  canRetry = input(true);

  retry = output<void>();
}
