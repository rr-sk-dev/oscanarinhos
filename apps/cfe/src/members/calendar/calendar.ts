import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { ErrorState } from '@canarinhos/ngx-cui';
import { CalendarEvent } from '@canarinhos/shared-types';
import { PageHeader } from '../../shared/page-header/page-header';
import { AuthService } from '../auth/auth.service';
import { CalendarService } from './calendar.service';
import { EventCard } from './event-card/event-card';
import { gridEnd, gridStart, MonthView } from './month-view/month-view';

export interface DayGroup {
  key: string;
  events: CalendarEvent[];
}

/** Groups events by their local calendar day, keeping the input order. */
export function groupByDate(events: CalendarEvent[]): DayGroup[] {
  const groups = new Map<string, DayGroup>();

  for (const event of events) {
    const date = new Date(event.startsAt);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, events: [] };
      groups.set(key, group);
    }
    group.events.push(event);
  }

  return Array.from(groups.values());
}

export type CalendarMode = 'list' | 'month';

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

/** Calendário: the team's upcoming events grouped by day. */
@Component({
  selector: 'app-calendar',
  imports: [DatePipe, ErrorState, EventCard, MonthView, PageHeader, RouterLink],
  templateUrl: './calendar.html',
  host: { class: 'block' },
})
export class Calendar {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly calendar = inject(CalendarService);

  protected readonly modes: { mode: CalendarMode; label: string }[] = [
    { mode: 'list', label: 'Lista' },
    { mode: 'month', label: 'Mês' },
  ];
  protected readonly mode = signal<CalendarMode>('list');
  protected readonly month = signal(startOfMonth(new Date()));

  constructor() {
    // The service is a root singleton: drop a month window left over from an earlier visit.
    this.calendar.useDefaultRange();
  }

  protected readonly groups = computed(() => groupByDate(this.calendar.events()));
  protected readonly canCreate = computed(() => {
    const role = this.auth.activeMembership()?.role;
    return role === 'ADMIN' || role === 'COACH';
  });

  protected setMode(mode: CalendarMode): void {
    this.mode.set(mode);
    if (mode === 'list') {
      this.calendar.useDefaultRange();
      return;
    }
    this.showMonth(this.month());
  }

  protected showMonth(month: Date): void {
    this.month.set(month);
    this.calendar.useRange({ from: gridStart(month), to: gridEnd(month) });
  }

  protected openEvent(id: string): void {
    void this.router.navigate(['/members/events', id]);
  }
}
