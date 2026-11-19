import { Component, input } from '@angular/core';

/** Primary action button. */
@Component({
  selector: 'cui-button',
  template: `
    <button
      [type]="type()"
      [disabled]="disabled()"
      class="w-full rounded-lg bg-cui-yellow-500 px-4 py-2 text-sm font-bold text-cui-black transition-opacity disabled:opacity-50"
    >
      <ng-content />
    </button>
  `,
})
export class Button {
  type = input<'button' | 'submit'>('button');
  disabled = input(false);
}
