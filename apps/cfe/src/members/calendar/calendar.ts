import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ErrorState } from '@canarinhos/ngx-cui';
import { CalendarEvent } from '@canarinhos/shared-types';
import { PageHeader } from '../../shared/page-header/page-header';
import { AuthService } from '../auth/auth.service';
import { CalendarService } from './calendar.service';
import { EventCard } from './event-card/event-card';

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

/** Calendário: the team's upcoming events grouped by day. */
@Component({
  selector: 'app-calendar',
  imports: [DatePipe, ErrorState, EventCard, PageHeader, RouterLink],
  templateUrl: './calendar.html',
  host: { class: 'block' },
})
export class Calendar {
  private readonly auth = inject(AuthService);
  protected readonly calendar = inject(CalendarService);

  protected readonly groups = computed(() => groupByDate(this.calendar.events()));
  protected readonly canCreate = computed(() => {
    const role = this.auth.activeMembership()?.role;
    return role === 'ADMIN' || role === 'COACH';
  });
}
