import { Component, input, model } from '@angular/core';

/** Labelled single-line text input. */
@Component({
  selector: 'cui-text-field',
  templateUrl: './text-field.html',
})
export class TextField {
  label = input.required<string>();
  type = input<'text' | 'email'>('text');
  inputMode = input<'text' | 'email' | 'numeric'>('text');
  autocomplete = input('off');
  maxLength = input<number | null>(null);
  value = model('');

  protected readonly id = `cui-text-field-${nextId++}`;

  protected update(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value);
  }
}

let nextId = 0;
