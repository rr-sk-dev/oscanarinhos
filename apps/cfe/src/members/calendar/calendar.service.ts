import { httpResource } from '@angular/common/http';
import { computed, inject, Service, signal } from '@angular/core';
import { CalendarEvent } from '@canarinhos/shared-types';
import { environment } from '../../environments/environment';
import { reloadOnResume } from '../../shared/data-refresh';
import { valueOr } from '../../shared/resource-value';
import { AuthService } from '../auth/auth.service';

const DEFAULT_WINDOW_DAYS = 60;

export interface CalendarRange {
  from: Date;
  to: Date;
}

function defaultRange(): CalendarRange {
  const from = new Date();
  from.setHours(0, 0, 0, 0);
  const to = new Date(from);
  to.setDate(to.getDate() + DEFAULT_WINDOW_DAYS);
  return { from, to };
}

@Service()
export class CalendarService {
  private readonly auth = inject(AuthService);
  private readonly baseUrl = environment.apiUrl;

  /** Events starting within [from, to). Today through 60 days ahead by default. */
  readonly range = signal<CalendarRange>(defaultRange());
  private lastDefaultRange = this.range();

  private readonly resource = httpResource<CalendarEvent[]>(() => {
    const teamId = this.auth.activeMembership()?.teamId;
    if (!teamId) {
      return undefined;
    }
    const { from, to } = this.range();
    const query = `from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;
    return `${this.baseUrl}/api/teams/${teamId}/events?${query}`;
  });

  private readonly value = valueOr(this.resource, undefined);
  readonly events = computed<CalendarEvent[]>(() => this.value() ?? []);
  readonly isLoading = this.resource.isLoading;
  readonly error = computed(() =>
    this.resource.error() ? 'Falha ao carregar o calendário' : null,
  );

  constructor() {
    reloadOnResume(this.resource);
  }

  reload(): void {
    if (this.refreshDefaultRange()) {
      return;
    }
    this.resource.reload();
  }

  /**
   * Moves an untouched default window to the current day. Returns true when the window changed,
   * because the resource then refetches by itself and an extra reload() would double the request.
   */
  private refreshDefaultRange(): boolean {
    if (this.range() !== this.lastDefaultRange) {
      return false;
    }
    const next = defaultRange();
    if (next.from.getTime() === this.lastDefaultRange.from.getTime()) {
      return false;
    }
    this.lastDefaultRange = next;
    this.range.set(next);
    return true;
  }
}
