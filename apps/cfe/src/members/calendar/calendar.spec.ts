import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CalendarEvent, Role } from '@canarinhos/shared-types';
import { environment } from '../../environments/environment';
import { Calendar } from './calendar';
import { CalendarService } from './calendar.service';

const counts = { yes: 3, maybe: 1, no: 2, noAnswer: 4 };

function anEvent(overrides: Partial<CalendarEvent>): CalendarEvent {
  return {
    id: 'e1',
    teamId: 't1',
    type: 'TRAINING',
    title: 'Treino',
    startsAt: new Date(2026, 10, 20, 19, 0).toISOString(),
    endsAt: null,
    location: 'Campo',
    notes: null,
    respondBy: null,
    status: 'SCHEDULED',
    matchId: null,
    seriesId: null,
    myAnswer: null,
    counts,
    ...overrides,
  };
}

describe('Calendar', () => {
  let fixture: ComponentFixture<Calendar>;
  let http: HttpTestingController;
  let element: HTMLElement;

  async function setup(role: Role = 'PLAYER', events?: CalendarEvent[] | 500): Promise<void> {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    await TestBed.configureTestingModule({
      imports: [Calendar],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Calendar);
    element = fixture.nativeElement;
    fixture.autoDetectChanges();
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
    http.expectOne(`${environment.apiUrl}/api/me`).flush({
      user: {},
      memberships: [{ teamId: 't1', teamName: 'T', role, membershipId: 'm1' }],
    });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    if (events === undefined) {
      return;
    }
    const request = http.expectOne((req) => req.url.includes('/api/teams/t1/events'));
    if (events === 500) {
      request.flush({}, { status: 500, statusText: 'Server Error' });
    } else {
      request.flush(events);
    }
    await fixture.whenStable();
  }

  afterEach(() => localStorage.clear());

  it('requests events for the active membership team', async () => {
    await setup('PLAYER');
    const request = http.expectOne((req) => req.url.includes('/api/teams/t1/events'));
    expect(request.request.url.startsWith(`${environment.apiUrl}/api/teams/t1/events`)).toBe(true);
    expect(request.request.url).toContain('from=');
    expect(request.request.url).toContain('to=');
    request.flush([]);
  });

  it('groups events by day', async () => {
    await setup('PLAYER', [
      anEvent({ id: 'a', title: 'Treino A' }),
      anEvent({ id: 'b', title: 'Jogo B', startsAt: new Date(2026, 10, 20, 21, 0).toISOString() }),
      anEvent({
        id: 'c',
        title: 'Treino C',
        startsAt: new Date(2026, 10, 22, 19, 0).toISOString(),
      }),
    ]);

    const days = element.querySelectorAll('h2');
    expect(days.length).toBe(2);
    expect(days[0].textContent).toContain('20 de novembro');
    expect(element.querySelectorAll('app-event-card').length).toBe(3);
    expect(element.querySelector('a[href="/members/events/a"]')).not.toBeNull();
  });

  it('shows a canceled badge on canceled events', async () => {
    await setup('PLAYER', [anEvent({ status: 'CANCELED' })]);

    expect(element.textContent).toContain('Cancelado');
  });

  it.each<Role>(['ADMIN', 'COACH'])('shows Novo evento to %s', async (role) => {
    await setup(role, []);

    expect(element.textContent).toContain('Novo evento');
  });

  it.each<Role>(['PLAYER', 'STAFF'])('hides Novo evento from %s', async (role) => {
    await setup(role, []);

    expect(element.textContent).not.toContain('Novo evento');
  });

  it('shows an error state and retries through reload()', async () => {
    await setup('PLAYER', 500);
    const reload = vi.spyOn(TestBed.inject(CalendarService), 'reload');

    expect(element.querySelector('cui-error-state')).not.toBeNull();
    element.querySelector<HTMLButtonElement>('cui-error-state button')!.click();

    expect(reload).toHaveBeenCalled();
  });

  it('links to the stats page', async () => {
    await setup('PLAYER', []);

    expect(element.querySelector('a[href="/members/stats"]')?.textContent).toContain(
      'Estatísticas',
    );
  });

  it('switches to the month view, loading the visible grid, and back to the default range', async () => {
    await setup('PLAYER', []);
    const service = TestBed.inject(CalendarService);
    const defaultRange = service.range();
    const [listButton, monthButton] = Array.from(
      element.querySelectorAll<HTMLButtonElement>('[aria-pressed]'),
    );
    expect(listButton.getAttribute('aria-pressed')).toBe('true');

    monthButton.click();
    TestBed.tick();
    http.expectOne((req) => req.url.includes('/events')).flush([]);
    await fixture.whenStable();

    expect(monthButton.getAttribute('aria-pressed')).toBe('true');
    expect(element.querySelector('app-month-view')).not.toBeNull();
    const { from, to } = service.range();
    expect(from.getDay()).toBe(1);
    expect(Math.round((to.getTime() - from.getTime()) / 86_400_000)).toBe(42);

    listButton.click();
    TestBed.tick();
    http.expectOne((req) => req.url.includes('/events')).flush([]);
    await fixture.whenStable();

    expect(service.range().from.getTime()).toBe(defaultRange.from.getTime());
  });
});
