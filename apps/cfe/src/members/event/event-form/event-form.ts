import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ErrorState } from '@canarinhos/ngx-cui';
import { CalendarEvent, CreateEventInput } from '@canarinhos/shared-types';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { injectPageTitle } from '../../../app/app-title.strategy';
import { AuthService } from '../../auth/auth.service';
import { CalendarService } from '../../calendar/calendar.service';
import { EventService } from '../event.service';

type FormType = Exclude<CalendarEvent['type'], 'GAME'>;
type FieldKey = 'title' | 'startsAt' | 'endsAt' | 'respondBy' | 'weekdays' | 'repeatUntil';
type FieldErrors = Partial<Record<FieldKey, string>>;

const MAX_SERIES_MINUTES = 720;
const MINUTE_MS = 60_000;

const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Seg' },
  { value: 2, label: 'Ter' },
  { value: 3, label: 'Qua' },
  { value: 4, label: 'Qui' },
  { value: 5, label: 'Sex' },
  { value: 6, label: 'Sáb' },
  { value: 7, label: 'Dom' },
];

const pad = (value: number): string => String(value).padStart(2, '0');

/** ISO instant to the `YYYY-MM-DDTHH:mm` value of a datetime-local input, in the local zone. */
function toLocalInput(iso: string | null): string {
  if (!iso) {
    return '';
  }
  const date = new Date(iso);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** A datetime-local value (local zone) to its UTC ISO string. */
function toIso(localValue: string): string {
  return new Date(localValue).toISOString();
}

function toMinutes(localValue: string): number {
  return Math.floor(new Date(localValue).getTime() / MINUTE_MS);
}

/** Create or edit one event, or create a weekly series of trainings. */
@Component({
  selector: 'app-event-form',
  imports: [ErrorState, RouterLink],
  templateUrl: './event-form.html',
  providers: [EventService],
})
export class EventForm {
  /** Route param, bound by withComponentInputBinding. Absent when creating. */
  readonly id = input<string>();

  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly calendar = inject(CalendarService);
  private readonly router = inject(Router);
  protected readonly service = inject(EventService);

  protected readonly weekdayOptions = WEEKDAY_OPTIONS;
  protected readonly inputClass =
    'mt-1 w-full rounded-lg border border-cui-line bg-cui-surface px-3 py-2 text-sm text-cui-ink focus:border-cui-accent-text focus:outline-none disabled:opacity-50';

  protected readonly type = signal<FormType>('TRAINING');
  protected readonly title = signal('');
  protected readonly startsAt = signal('');
  protected readonly endsAt = signal('');
  protected readonly location = signal('');
  protected readonly notes = signal('');
  protected readonly respondBy = signal('');
  protected readonly repeats = signal(false);
  protected readonly weekdays = signal<number[]>([]);
  protected readonly repeatUntil = signal('');

  protected readonly isSubmitted = signal(false);
  protected readonly isBusy = signal(false);
  protected readonly isConfirmingCancel = signal(false);
  protected readonly errorMessage = signal<string | null>(null);
  private readonly isPopulated = signal(false);

  protected readonly isEditing = computed(() => !!this.id());
  protected readonly isGame = computed(() => this.service.event()?.type === 'GAME');
  protected readonly canRepeat = computed(() => !this.isEditing() && this.type() === 'TRAINING');
  protected readonly isSeries = computed(() => this.canRepeat() && this.repeats());
  protected readonly canCancel = computed(() => {
    const event = this.service.event();
    return !!event && event.type !== 'GAME' && event.status !== 'CANCELED';
  });
  protected readonly heading = computed(() => {
    if (!this.isEditing()) {
      return 'Novo evento';
    }
    return this.isGame() ? 'Notas do jogo' : 'Editar evento';
  });

  protected readonly errors = computed<FieldErrors>(() => {
    if (this.isGame()) {
      return {};
    }
    const errors: FieldErrors = {};
    const start = this.startsAt();
    const end = this.endsAt();
    const respondBy = this.respondBy();
    if (!this.title().trim()) {
      errors.title = 'Indica o título.';
    }
    if (!start) {
      errors.startsAt = 'Indica o início.';
    }
    if (start && end && toMinutes(end) <= toMinutes(start)) {
      errors.endsAt = 'O fim tem de ser depois do início.';
    }
    if (start && respondBy && toMinutes(respondBy) >= toMinutes(start)) {
      errors.respondBy = 'O prazo de resposta tem de ser antes do início.';
    }
    return this.isSeries() ? { ...errors, ...this.seriesErrors(start, end) } : errors;
  });
  protected readonly hasErrors = computed(() => Object.keys(this.errors()).length > 0);

  constructor() {
    effect(() => this.service.eventId.set(this.id() ?? null));
    effect(() => this.populate(this.service.event()));
    injectPageTitle(
      computed(() => (this.isEditing() ? this.service.event()?.title : 'Novo evento')),
    );
  }

  protected setText(target: { set(value: string): void }, event: Event): void {
    target.set((event.target as HTMLInputElement).value);
  }

  protected setType(event: Event): void {
    this.type.set((event.target as HTMLSelectElement).value as FormType);
  }

  protected toggleRepeats(): void {
    this.repeats.update((current) => !current);
  }

  protected toggleWeekday(day: number): void {
    this.weekdays.update((current) =>
      current.includes(day) ? current.filter((value) => value !== day) : [...current, day],
    );
  }

  protected errorOf(key: FieldKey): string | undefined {
    return this.isSubmitted() ? this.errors()[key] : undefined;
  }

  protected async submit(event: Event): Promise<void> {
    event.preventDefault();
    if (this.isBusy()) {
      return;
    }
    this.isSubmitted.set(true);
    if (this.hasErrors()) {
      return;
    }
    await this.save(() => this.send());
  }

  protected askToCancel(): void {
    this.isConfirmingCancel.set(true);
  }

  protected dismissCancel(): void {
    this.isConfirmingCancel.set(false);
  }

  protected async confirmCancel(): Promise<void> {
    if (this.isBusy()) {
      return;
    }
    await this.save(() => this.patch({ status: 'CANCELED' }));
  }

  private seriesErrors(start: string, end: string): FieldErrors {
    const errors: FieldErrors = {};
    if (this.weekdays().length === 0) {
      errors.weekdays = 'Escolhe pelo menos um dia da semana.';
    }
    if (!end) {
      errors.endsAt = 'Indica a hora de fim para repetir.';
    } else if (start && toMinutes(end) - toMinutes(start) > MAX_SERIES_MINUTES) {
      errors.endsAt = 'Um treino repetido pode durar no máximo 12 horas.';
    }
    const until = this.repeatUntil();
    if (!until) {
      errors.repeatUntil = 'Indica até quando repetir.';
    } else if (start && until < start.slice(0, 10)) {
      errors.repeatUntil = 'A data final tem de ser igual ou depois do início.';
    }
    return errors;
  }

  private populate(event: CalendarEvent | undefined): void {
    if (!event || this.isPopulated()) {
      return;
    }
    this.isPopulated.set(true);
    this.title.set(event.title);
    this.startsAt.set(toLocalInput(event.startsAt));
    this.endsAt.set(toLocalInput(event.endsAt));
    this.location.set(event.location ?? '');
    this.notes.set(event.notes ?? '');
    this.respondBy.set(toLocalInput(event.respondBy));
    if (event.type !== 'GAME') {
      this.type.set(event.type);
    }
  }

  /** Runs the request, then refreshes the calendar and leaves the form. */
  private async save(request: () => Promise<unknown>): Promise<void> {
    this.isBusy.set(true);
    this.errorMessage.set(null);
    try {
      await request();
    } catch {
      this.errorMessage.set('Não foi possível guardar. Verifica os dados e tenta novamente.');
      this.isBusy.set(false);
      return;
    }
    this.calendar.reload();
    this.isBusy.set(false);
    const id = this.id();
    await this.router.navigate(id ? ['/members/events', id] : ['/members']);
  }

  private send(): Promise<unknown> {
    if (this.isEditing()) {
      return this.patch(this.changedFields());
    }
    return this.isSeries() ? this.postSeries() : this.postEvent();
  }

  private baseUrl(): string {
    return `${environment.apiUrl}/api/teams/${this.auth.activeMembership()?.teamId}/events`;
  }

  private postEvent(): Promise<unknown> {
    const body: CreateEventInput = {
      type: this.type(),
      title: this.title().trim(),
      startsAt: toIso(this.startsAt()),
    };
    if (this.endsAt()) {
      body.endsAt = toIso(this.endsAt());
    }
    if (this.location().trim()) {
      body.location = this.location().trim();
    }
    if (this.notes().trim()) {
      body.notes = this.notes().trim();
    }
    if (this.respondBy()) {
      body.respondBy = toIso(this.respondBy());
    }
    return firstValueFrom(this.http.post(this.baseUrl(), body));
  }

  /**
   * The series is sent as wall-clock values (start time, dates) that capi reads as Europe/Lisbon
   * time, so they match the instants of a single event only while the browser is in that zone.
   */
  private postSeries(): Promise<unknown> {
    const start = this.startsAt();
    const body: Record<string, unknown> = {
      title: this.title().trim(),
      weekdays: [...this.weekdays()].sort((a, b) => a - b),
      startTime: start.slice(11, 16),
      durationMinutes: toMinutes(this.endsAt()) - toMinutes(start),
      startDate: start.slice(0, 10),
      endDate: this.repeatUntil(),
    };
    if (this.location().trim()) {
      body['location'] = this.location().trim();
    }
    return firstValueFrom(this.http.post(`${this.baseUrl()}/series`, body));
  }

  /** Only what differs from the loaded event; a game exposes its notes alone. */
  private changedFields(): Record<string, unknown> {
    const event = this.service.event();
    if (!event) {
      return {};
    }
    const changes: Record<string, unknown> = {};
    const notes = this.notes().trim();
    if (notes !== (event.notes ?? '')) {
      changes['notes'] = notes || null;
    }
    if (event.type === 'GAME') {
      return changes;
    }
    const title = this.title().trim();
    if (title !== event.title) {
      changes['title'] = title;
    }
    const location = this.location().trim();
    if (location !== (event.location ?? '')) {
      changes['location'] = location || null;
    }
    this.addChangedInstant(changes, 'startsAt', this.startsAt(), event.startsAt);
    this.addChangedInstant(changes, 'endsAt', this.endsAt(), event.endsAt);
    this.addChangedInstant(changes, 'respondBy', this.respondBy(), event.respondBy);
    return changes;
  }

  private addChangedInstant(
    changes: Record<string, unknown>,
    key: string,
    localValue: string,
    original: string | null,
  ): void {
    // The inputs hold minutes, so compare at that precision.
    const originalMinutes = original ? Math.floor(new Date(original).getTime() / MINUTE_MS) : null;
    const minutes = localValue ? toMinutes(localValue) : null;
    if (minutes === originalMinutes) {
      return;
    }
    changes[key] = localValue ? toIso(localValue) : null;
  }

  private async patch(changes: Record<string, unknown>): Promise<unknown> {
    if (Object.keys(changes).length === 0) {
      return;
    }
    return firstValueFrom(this.http.patch(`${this.baseUrl()}/${this.id()}`, changes));
  }
}
