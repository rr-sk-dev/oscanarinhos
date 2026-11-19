import { DatePipe } from '@angular/common';
import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvailabilityAnswer, CalendarEvent, EventType } from '@canarinhos/shared-types';

const TYPE_LABELS: Record<EventType, string> = {
  TRAINING: 'Treino',
  GAME: 'Jogo',
  CUSTOM: 'Evento',
};

const ANSWER_LABELS: Record<AvailabilityAnswer, string> = {
  YES: 'Vou',
  MAYBE: 'Talvez',
  NO: 'Não vou',
};

/** One calendar event: type, title, time, place, the viewer's answer and the answer counts. */
@Component({
  selector: 'app-event-card',
  imports: [DatePipe, RouterLink],
  host: { class: 'block' },
  template: `
    @let item = event();
    <a
      [routerLink]="['/members/events', item.id]"
      class="block rounded-[22px] border border-cui-line bg-cui-surface px-3.5 py-3.5 transition-shadow hover:shadow-[var(--cui-card-shadow-hover)]"
      [class.opacity-60]="isCanceled()"
    >
      <p class="flex items-center gap-2 text-[11px] font-bold uppercase text-cui-ink-3">
        <span>{{ typeLabel() }}</span>
        @if (isCanceled()) {
          <span class="rounded-full bg-cui-loss-bg px-2 py-0.5 text-cui-loss">Cancelado</span>
        }
      </p>
      <h3 class="mt-1 text-base font-extrabold text-cui-ink">{{ item.title }}</h3>
      <p class="mt-0.5 text-xs text-cui-ink-2">
        {{ item.startsAt | date: 'HH:mm' }}
        @if (item.endsAt) {
          - {{ item.endsAt | date: 'HH:mm' }}
        }
        @if (item.location) {
          · {{ item.location }}
        }
      </p>
      <p class="mt-2 text-xs text-cui-ink-2">
        <span class="font-bold text-cui-ink">{{ answerLabel() }}</span>
        · {{ item.counts.yes }} vão · {{ item.counts.maybe }} talvez · {{ item.counts.no }} não ·
        {{ item.counts.noAnswer }} sem resposta
      </p>
    </a>
  `,
})
export class EventCard {
  readonly event = input.required<CalendarEvent>();

  protected typeLabel(): string {
    return TYPE_LABELS[this.event().type];
  }

  protected isCanceled(): boolean {
    return this.event().status === 'CANCELED';
  }

  protected answerLabel(): string {
    const answer = this.event().myAnswer;
    return answer ? ANSWER_LABELS[answer] : 'Sem resposta';
  }
}
