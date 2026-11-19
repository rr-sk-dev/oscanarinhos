import { Component, input, output, signal } from '@angular/core';
import { AvailabilityAnswer } from '@canarinhos/shared-types';

export interface AnsweredEvent {
  answer: AvailabilityAnswer;
  note?: string;
}

const OPTIONS: { answer: AvailabilityAnswer; label: string }[] = [
  { answer: 'YES', label: 'Vou' },
  { answer: 'MAYBE', label: 'Talvez' },
  { answer: 'NO', label: 'Não vou' },
];

const MAX_NOTE_LENGTH = 140;

/** The three answer buttons and an optional note. Emits the tapped answer; saves nothing itself. */
@Component({
  selector: 'app-response-buttons',
  host: { class: 'block' },
  template: `
    <div class="grid grid-cols-3 gap-2" role="group" aria-label="A tua resposta">
      @for (option of options; track option.answer) {
        <button
          type="button"
          class="rounded-xl border px-3 py-2.5 text-sm font-bold transition-colors disabled:opacity-50"
          [class]="
            option.answer === answer()
              ? 'border-cui-yellow-500 bg-cui-yellow-500 text-black'
              : 'border-cui-line bg-cui-surface text-cui-ink'
          "
          [attr.aria-pressed]="option.answer === answer()"
          [disabled]="disabled()"
          (click)="choose(option.answer)"
        >
          {{ option.label }}
        </button>
      }
    </div>
    <label class="mt-3 block text-xs font-bold text-cui-ink-2" for="response-note">
      Nota (opcional)
    </label>
    <input
      id="response-note"
      name="note"
      type="text"
      class="mt-1 w-full rounded-xl border border-cui-line bg-cui-surface px-3 py-2 text-sm text-cui-ink"
      [attr.maxlength]="maxNoteLength"
      [disabled]="disabled()"
      [value]="note()"
      (input)="note.set($any($event.target).value)"
    />
  `,
})
export class ResponseButtons {
  readonly answer = input<AvailabilityAnswer | null>(null);
  readonly disabled = input(false);
  readonly answered = output<AnsweredEvent>();

  protected readonly options = OPTIONS;
  protected readonly maxNoteLength = MAX_NOTE_LENGTH;
  protected readonly note = signal('');

  protected choose(answer: AvailabilityAnswer): void {
    const note = this.note().trim();
    this.answered.emit(note ? { answer, note } : { answer });
  }
}
