import { DatePipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { CalendarEvent, EventType } from '@canarinhos/shared-types';

const WEEKS_SHOWN = 6;
const DAYS_PER_WEEK = 7;
const TYPE_LABELS: Record<EventType, string> = {
  TRAINING: 'Treino',
  GAME: 'Jogo',
  CUSTOM: 'Evento',
};
const DOT_CLASSES: Record<EventType, string> = {
  TRAINING: 'bg-cui-yellow-500',
  GAME: 'bg-cui-loss',
  CUSTOM: 'bg-cui-ink-3',
};

export interface MonthDay {
  key: string;
  date: Date;
  isInMonth: boolean;
  events: CalendarEvent[];
}

export function dayKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** The Monday on or before the first day of `month`: where the 6x7 grid starts. */
export function gridStart(month: Date): Date {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const daysSinceMonday = (first.getDay() + 6) % DAYS_PER_WEEK;
  return new Date(first.getFullYear(), first.getMonth(), 1 - daysSinceMonday);
}

/** The first day after the grid, so [gridStart, gridEnd) is the range of events it shows. */
export function gridEnd(month: Date): Date {
  const start = gridStart(month);
  return new Date(
    start.getFullYear(),
    start.getMonth(),
    start.getDate() + WEEKS_SHOWN * DAYS_PER_WEEK,
  );
}

/** A month as a grid of 6 weeks starting on Monday, with the events on their local day. */
@Component({
  selector: 'app-month-view',
  imports: [DatePipe],
  host: { class: 'block' },
  templateUrl: './month-view.html',
})
export class MonthView {
  readonly month = input.required<Date>();
  readonly events = input.required<CalendarEvent[]>();
  readonly eventSelected = output<string>();
  readonly monthChange = output<Date>();

  private readonly selectedKey = signal<string | null>(null);

  protected readonly days = computed<MonthDay[]>(() => {
    const month = this.month();
    const start = gridStart(month);
    const byDay = new Map<string, CalendarEvent[]>();
    for (const event of this.events()) {
      const key = dayKey(new Date(event.startsAt));
      byDay.set(key, [...(byDay.get(key) ?? []), event]);
    }
    return Array.from({ length: WEEKS_SHOWN * DAYS_PER_WEEK }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + index);
      const key = dayKey(date);
      return {
        key,
        date,
        isInMonth: date.getMonth() === month.getMonth(),
        events: byDay.get(key) ?? [],
      };
    });
  });
  protected readonly weekdays = computed(() =>
    this.days()
      .slice(0, DAYS_PER_WEEK)
      .map((d) => d.date),
  );
  protected readonly selectedDay = computed(
    () => this.days().find((day) => day.key === this.selectedKey()) ?? null,
  );

  protected typeLabel(type: EventType): string {
    return TYPE_LABELS[type];
  }

  protected dotClass(type: EventType): string {
    return DOT_CLASSES[type];
  }

  protected select(day: MonthDay): void {
    this.selectedKey.set(day.key);
  }

  protected shift(delta: number): void {
    const month = this.month();
    this.selectedKey.set(null);
    this.monthChange.emit(new Date(month.getFullYear(), month.getMonth() + delta, 1));
  }
}
