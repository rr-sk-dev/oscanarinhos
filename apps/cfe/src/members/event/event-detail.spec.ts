import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AvailabilitySummary, CalendarEvent, MemberResponse, Role } from '@canarinhos/shared-types';
import { environment } from '../../environments/environment';
import { EventDetail } from './event-detail';

const EVENT_URL = `${environment.apiUrl}/api/teams/t1/events/e1`;
const AVAILABILITY_URL = `${EVENT_URL}/availability`;
const ATTENDANCE_URL = `${EVENT_URL}/attendance`;

function aMember(name: string, role: Role = 'PLAYER', note: string | null = null): MemberResponse {
  return { membershipId: `m-${name}`, displayName: name, role, note };
}

const summary: AvailabilitySummary = {
  yes: [aMember('Ana'), aMember('Rui', 'COACH')],
  maybe: [aMember('Bia', 'PLAYER', 'Talvez chegue tarde')],
  no: [aMember('Carlos')],
  noAnswer: [aMember('Dina', 'STAFF')],
};

function anEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'e1',
    teamId: 't1',
    type: 'TRAINING',
    title: 'Treino de quinta',
    startsAt: new Date(Date.now() + 3 * 86_400_000).toISOString(),
    endsAt: null,
    location: 'Campo',
    notes: null,
    respondBy: null,
    status: 'SCHEDULED',
    matchId: null,
    seriesId: null,
    myAnswer: null,
    counts: { yes: 2, maybe: 1, no: 1, noAnswer: 1 },
    ...overrides,
  };
}

describe('EventDetail', () => {
  let fixture: ComponentFixture<EventDetail>;
  let http: HttpTestingController;
  let element: HTMLElement;

  /** Lets resolved HTTP promises and effects run. whenStable() never resolves with the page clock. */
  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  // The page clock is a setInterval, which would keep whenStable() pending; fake it and Date only.
  beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] }));

  async function setup(
    options: { role?: Role; event?: CalendarEvent | 404 | 500 } = {},
  ): Promise<void> {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    await TestBed.configureTestingModule({
      imports: [EventDetail],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(EventDetail);
    fixture.componentRef.setInput('id', 'e1');
    element = fixture.nativeElement;
    fixture.autoDetectChanges();
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
    http.expectOne(`${environment.apiUrl}/api/me`).flush({
      user: {},
      memberships: [
        { teamId: 't1', teamName: 'T', role: options.role ?? 'PLAYER', membershipId: 'm1' },
      ],
    });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    const event = options.event ?? anEvent();
    const eventRequest = http.expectOne(EVENT_URL);
    const availabilityRequest = http.expectOne(AVAILABILITY_URL);
    if (event === 404 || event === 500) {
      eventRequest.flush({}, { status: event, statusText: 'Error' });
    } else {
      eventRequest.flush(event);
    }
    availabilityRequest.flush(summary);
    await settle();
  }

  function button(label: string): HTMLButtonElement {
    const found = Array.from(element.querySelectorAll('button')).find(
      (candidate) => candidate.textContent?.trim() === label,
    );
    if (!found) {
      throw new Error(`No button "${label}"`);
    }
    return found;
  }

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it('sends YES when tapping Vou, then refreshes the lists, the event and the calendar', async () => {
    await setup();

    button('Vou').click();
    TestBed.tick();
    const put = http.expectOne((req) => req.method === 'PUT' && req.url === AVAILABILITY_URL);
    expect(put.request.body).toEqual({ answer: 'YES' });
    put.flush({ eventId: 'e1', answer: 'YES', note: null });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    http.expectOne(AVAILABILITY_URL).flush({ ...summary, yes: [...summary.yes, aMember('Eu')] });
    http.expectOne(EVENT_URL).flush(anEvent({ myAnswer: 'YES' }));
    http.expectOne((req) => req.url.includes('/api/teams/t1/events?')).flush([]);
    await settle();

    expect(element.textContent).toContain('Eu');
    expect(button('Vou').getAttribute('aria-pressed')).toBe('true');
  });

  it('sends the note when it is filled', async () => {
    await setup();

    const note = element.querySelector<HTMLInputElement>('input[name="note"]')!;
    note.value = 'Chego às 19h30';
    note.dispatchEvent(new Event('input'));
    button('Talvez').click();
    TestBed.tick();

    const put = http.expectOne((req) => req.method === 'PUT' && req.url === AVAILABILITY_URL);
    expect(put.request.body).toEqual({ answer: 'MAYBE', note: 'Chego às 19h30' });
    put.flush({ eventId: 'e1', answer: 'MAYBE', note: 'Chego às 19h30' });
  });

  it('shows an error message when saving fails', async () => {
    await setup();

    button('Vou').click();
    TestBed.tick();
    http
      .expectOne((req) => req.method === 'PUT')
      .flush({}, { status: 500, statusText: 'Server Error' });
    await settle();

    expect(element.querySelector('[role="status"]')?.textContent).toContain('Não foi possível');
  });

  it('disables the buttons for a canceled event', async () => {
    await setup({ event: anEvent({ status: 'CANCELED' }) });

    expect(button('Vou').disabled).toBe(true);
    expect(element.textContent).toContain('Respostas fechadas');
  });

  it('disables the buttons once the event has started', async () => {
    await setup({ event: anEvent({ startsAt: new Date(Date.now() - 60_000).toISOString() }) });

    expect(button('Não vou').disabled).toBe(true);
    expect(element.textContent).toContain('Respostas fechadas');
  });

  it('disables the buttons after respondBy', async () => {
    await setup({ event: anEvent({ respondBy: new Date(Date.now() - 60_000).toISOString() }) });

    expect(button('Vou').disabled).toBe(true);
  });

  it('keeps the buttons enabled for an open event', async () => {
    await setup();

    expect(button('Vou').disabled).toBe(false);
    expect(element.textContent).not.toContain('Respostas fechadas');
  });

  it('lists four groups with counts, staff included', async () => {
    await setup();

    const headings = Array.from(element.querySelectorAll('h3')).map((h) => h.textContent?.trim());
    expect(headings).toEqual(['Vou (2)', 'Talvez (1)', 'Não vou (1)', 'Sem resposta (1)']);
    expect(element.textContent).toContain('Rui');
    expect(element.textContent).toContain('Dina');
    expect(element.textContent).toContain('Talvez chegue tarde');
  });

  it('shows the not-found state without retry on a 404', async () => {
    await setup({ event: 404 });

    expect(element.querySelector('cui-error-state')).not.toBeNull();
    expect(element.textContent).toContain('Evento não encontrado');
    expect(Array.from(element.querySelectorAll('button')).length).toBe(0);
  });

  it('offers retry on other errors', async () => {
    await setup({ event: 500 });

    expect(element.querySelector('cui-error-state button')).not.toBeNull();
  });

  it('shows Editar for coaches and Marcar presenças after the start', async () => {
    await setup({
      role: 'COACH',
      event: anEvent({ startsAt: new Date(Date.now() - 60_000).toISOString() }),
    });

    const editLink = element.querySelector<HTMLAnchorElement>('a[href="/members/events/e1/edit"]');
    expect(editLink?.textContent).toContain('Editar');
    expect(element.textContent).toContain('Marcar presenças');
  });

  it('hides staff actions from players', async () => {
    await setup({ role: 'PLAYER' });

    expect(element.textContent).not.toContain('Editar');
    expect(element.textContent).not.toContain('Marcar presenças');
  });

  describe('attendance', () => {
    const started = () => anEvent({ startsAt: new Date(Date.now() - 60_000).toISOString() });

    it('reveals the panel from the button, pre-checking the YES answers', async () => {
      await setup({ role: 'COACH', event: started() });
      expect(element.querySelector('app-attendance-panel')).toBeNull();

      button('Marcar presenças').click();
      TestBed.tick();
      http.expectOne(ATTENDANCE_URL).flush([]);
      await settle();

      const boxes = Array.from(
        element.querySelectorAll<HTMLInputElement>('app-attendance-panel input[type="checkbox"]'),
      );
      expect(boxes.filter((box) => box.checked).map((box) => box.name)).toEqual([
        'attended-m-Ana',
        'attended-m-Rui',
      ]);
    });

    it('puts the entries to the attendance endpoint', async () => {
      await setup({ role: 'ADMIN', event: started() });

      button('Marcar presenças').click();
      TestBed.tick();
      http.expectOne(ATTENDANCE_URL).flush([]);
      await settle();
      button('Guardar presenças').click();
      TestBed.tick();

      const put = http.expectOne(
        (req) => req.method === 'PUT' && req.url === `${EVENT_URL}/attendance`,
      );
      expect(put.request.body.entries).toHaveLength(5);
      expect(put.request.body.entries[0]).toEqual({ membershipId: 'm-Ana', attended: true });
      put.flush(null, { status: 204, statusText: 'No Content' });
      await settle();
      expect(element.textContent).toContain('Presenças guardadas');
      http.expectOne(ATTENDANCE_URL).flush([]);
    });

    it('shows the saved marks, not the YES answers, when the panel is opened', async () => {
      await setup({ role: 'COACH', event: started() });

      button('Marcar presenças').click();
      TestBed.tick();
      http.expectOne(ATTENDANCE_URL).flush([
        { membershipId: 'm-Ana', attended: false },
        { membershipId: 'm-Bia', attended: true },
      ]);
      await settle();

      const checked = Array.from(
        element.querySelectorAll<HTMLInputElement>('app-attendance-panel input:checked'),
      ).map((box) => box.name);
      expect(checked).toEqual(['attended-m-Rui', 'attended-m-Bia']);
    });

    it('reflects the server marks again after saving and reopening', async () => {
      await setup({ role: 'COACH', event: started() });

      button('Marcar presenças').click();
      TestBed.tick();
      http.expectOne(ATTENDANCE_URL).flush([]);
      await settle();
      element.querySelector<HTMLInputElement>('input[name="attended-m-Ana"]')!.click();
      button('Guardar presenças').click();
      TestBed.tick();
      http
        .expectOne((req) => req.method === 'PUT' && req.url === ATTENDANCE_URL)
        .flush(null, { status: 204, statusText: 'No Content' });
      await settle();
      http.expectOne(ATTENDANCE_URL).flush([{ membershipId: 'm-Ana', attended: false }]);
      await settle();

      button('Marcar presenças').click();
      TestBed.tick();
      button('Marcar presenças').click();
      TestBed.tick();
      http.expectOne(ATTENDANCE_URL).flush([{ membershipId: 'm-Ana', attended: false }]);
      await settle();

      expect(element.querySelector<HTMLInputElement>('input[name="attended-m-Ana"]')!.checked).toBe(
        false,
      );
    });

    it('does not offer the panel when the saved marks fail to load', async () => {
      await setup({ role: 'COACH', event: started() });

      button('Marcar presenças').click();
      TestBed.tick();
      http.expectOne(ATTENDANCE_URL).flush({}, { status: 500, statusText: 'Error' });
      await settle();

      expect(element.querySelector('app-attendance-panel')).toBeNull();
      expect(element.textContent).toContain('Falha ao carregar as presenças');
    });

    it('is not offered before the start, for a canceled event or to players', async () => {
      await setup({ role: 'COACH' });
      expect(element.textContent).not.toContain('Marcar presenças');
    });

    it('is not offered for a canceled event', async () => {
      await setup({ role: 'COACH', event: { ...started(), status: 'CANCELED' } });
      expect(element.textContent).not.toContain('Marcar presenças');
    });
  });
});
