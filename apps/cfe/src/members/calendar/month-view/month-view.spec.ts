import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CalendarEvent } from '@canarinhos/shared-types';
import { MonthView } from './month-view';

function anEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'e1',
    teamId: 't1',
    type: 'TRAINING',
    title: 'Treino',
    startsAt: new Date(2026, 10, 20, 19, 0).toISOString(),
    endsAt: null,
    location: null,
    notes: null,
    respondBy: null,
    status: 'SCHEDULED',
    matchId: null,
    seriesId: null,
    myAnswer: null,
    counts: { yes: 0, maybe: 0, no: 0, noAnswer: 0 },
    ...overrides,
  };
}

describe('MonthView', () => {
  let fixture: ComponentFixture<MonthView>;
  let element: HTMLElement;

  function setup(events: CalendarEvent[] = []): void {
    fixture = TestBed.createComponent(MonthView);
    fixture.componentRef.setInput('month', new Date(2026, 10, 1));
    fixture.componentRef.setInput('events', events);
    element = fixture.nativeElement;
    fixture.detectChanges();
  }

  const cells = () => element.querySelectorAll<HTMLElement>('[data-day]');

  it('renders 6 weeks of 7 days starting on Monday', () => {
    setup();

    expect(cells().length).toBe(42);
    // 1 Nov 2026 is a Sunday, so the grid starts on Monday 26 Oct.
    expect(cells()[0].dataset['day']).toBe('2026-10-26');
    expect(cells()[6].dataset['day']).toBe('2026-11-01');
    const headings = Array.from(element.querySelectorAll('[role="columnheader"]')).map((h) =>
      h.textContent?.trim().toLowerCase(),
    );
    expect(headings.length).toBe(7);
    expect(headings[0]).toMatch(/^seg/);
    expect(headings[6]).toMatch(/^dom/);
  });

  it('places events on the right day with accessible dots', () => {
    setup([anEvent({ title: 'Treino de quinta' })]);

    const day = element.querySelector('[data-day="2026-11-20"]')!;
    expect(day.querySelectorAll('[data-dot]').length).toBe(1);
    expect(day.textContent).toContain('Treino de quinta');
    expect(element.querySelector('[data-day="2026-11-21"] [data-dot]')).toBeNull();
  });

  it('lists the selected day events and emits the chosen one', () => {
    setup([
      anEvent({ id: 'a', title: 'Treino A' }),
      anEvent({ id: 'b', title: 'Jogo B', type: 'GAME' }),
    ]);
    const selected: string[] = [];
    fixture.componentInstance.eventSelected.subscribe((id) => selected.push(id));

    element.querySelector<HTMLButtonElement>('[data-day="2026-11-20"]')!.click();
    fixture.detectChanges();
    const buttons = element.querySelectorAll<HTMLButtonElement>('[data-day-event]');
    expect(buttons.length).toBe(2);
    buttons[1].click();

    expect(selected).toEqual(['b']);
  });

  it('emits monthChange for the previous and next month', () => {
    setup();
    const months: Date[] = [];
    fixture.componentInstance.monthChange.subscribe((month) => months.push(month));

    element.querySelector<HTMLButtonElement>('[data-nav="next"]')!.click();
    element.querySelector<HTMLButtonElement>('[data-nav="previous"]')!.click();

    expect(months.map((m) => [m.getFullYear(), m.getMonth(), m.getDate()])).toEqual([
      [2026, 11, 1],
      [2026, 9, 1],
    ]);
  });
});
