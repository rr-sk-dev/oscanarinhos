import { HttpClient, HttpErrorResponse, httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { AvailabilityAnswer, AvailabilitySummary, CalendarEvent } from '@canarinhos/shared-types';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { reloadOnResume } from '../../shared/data-refresh';
import { injectNow } from '../../shared/now';
import { valueOr } from '../../shared/resource-value';
import { AuthService } from '../auth/auth.service';
import { CalendarService } from '../calendar/calendar.service';

const EMPTY_SUMMARY: AvailabilitySummary = { yes: [], maybe: [], no: [], noAnswer: [] };
const CLOCK_PERIOD_MS = 30_000;

export interface SaveMessage {
  isError: boolean;
  text: string;
}

/**
 * One event and who answered what. Provided by the event page, not the root, so each page gets
 * its own instance; the page sets `eventId` from the route.
 */
@Service({ autoProvided: false })
export class EventService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly calendar = inject(CalendarService);
  private readonly now = injectNow(CLOCK_PERIOD_MS);

  readonly eventId = signal<string | null>(null);

  private readonly eventUrl = computed(() => {
    const teamId = this.auth.activeMembership()?.teamId;
    const eventId = this.eventId();
    if (!teamId || !eventId) {
      return null;
    }
    return `${environment.apiUrl}/api/teams/${teamId}/events/${encodeURIComponent(eventId)}`;
  });

  private readonly eventResource = httpResource<CalendarEvent>(() => this.eventUrl() ?? undefined);
  private readonly summaryResource = httpResource<AvailabilitySummary>(() => {
    const url = this.eventUrl();
    return url ? `${url}/availability` : undefined;
  });

  readonly event = valueOr(this.eventResource, undefined);
  private readonly summaryValue = valueOr(this.summaryResource, undefined);
  readonly summary = computed<AvailabilitySummary>(() => this.summaryValue() ?? EMPTY_SUMMARY);
  readonly isLoading = this.eventResource.isLoading;
  readonly isNotFound = computed(() => {
    const error = this.eventResource.error();
    return error instanceof HttpErrorResponse && error.status === 404;
  });
  readonly error = computed(() => {
    if (this.isNotFound()) {
      return 'Evento não encontrado';
    }
    return this.eventResource.error() ? 'Falha ao carregar o evento' : null;
  });

  readonly hasStarted = computed(() => {
    const event = this.event();
    return !!event && new Date(event.startsAt).getTime() <= this.now();
  });
  readonly isClosed = computed(() => {
    const event = this.event();
    if (!event) {
      return false;
    }
    const isPastDeadline = !!event.respondBy && new Date(event.respondBy).getTime() <= this.now();
    return event.status === 'CANCELED' || this.hasStarted() || isPastDeadline;
  });

  readonly isSaving = signal(false);
  readonly saveMessage = signal<SaveMessage | null>(null);

  constructor() {
    reloadOnResume({ reload: () => this.reload() });
  }

  reload(): void {
    this.eventResource.reload();
    this.summaryResource.reload();
  }

  /** Saves the viewer's answer, then refreshes this page and the calendar. Never rejects. */
  async respond(answer: AvailabilityAnswer, note?: string): Promise<void> {
    const url = this.eventUrl();
    if (!url) {
      return;
    }
    this.isSaving.set(true);
    this.saveMessage.set(null);
    try {
      await firstValueFrom(
        this.http.put<unknown>(`${url}/availability`, note ? { answer, note } : { answer }),
      );
    } catch (error) {
      const isClosedByServer = error instanceof HttpErrorResponse && error.status === 403;
      this.saveMessage.set({
        isError: true,
        text: isClosedByServer
          ? 'Respostas fechadas'
          : 'Não foi possível guardar a resposta. Tenta novamente.',
      });
      this.isSaving.set(false);
      if (isClosedByServer) {
        this.reload();
      }
      return;
    }
    this.saveMessage.set({ isError: false, text: 'Resposta guardada' });
    this.isSaving.set(false);
    this.reload();
    this.calendar.reload();
  }
}
