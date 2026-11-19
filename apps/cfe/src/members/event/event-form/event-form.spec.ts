import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { CalendarEvent } from '@canarinhos/shared-types';
import { environment } from '../../../environments/environment';
import { EventForm } from './event-form';

const EVENTS_URL = `${environment.apiUrl}/api/teams/t1/events`;
const EVENT_URL = `${EVENTS_URL}/e1`;

function anEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: 'e1',
    teamId: 't1',
    type: 'TRAINING',
    title: 'Treino de quinta',
    startsAt: new Date(2030, 0, 10, 20, 0).toISOString(),
    endsAt: new Date(2030, 0, 10, 21, 30).toISOString(),
    location: 'Campo',
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

describe('EventForm', () => {
  let fixture: ComponentFixture<EventForm>;
  let http: HttpTestingController;
  let element: HTMLElement;
  let navigate: ReturnType<typeof vi.spyOn>;

  async function settle(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  }

  beforeEach(() => vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval', 'Date'] }));
  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  async function setup(options: { id?: string; event?: CalendarEvent } = {}): Promise<void> {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    await TestBed.configureTestingModule({
      imports: [EventForm],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    fixture = TestBed.createComponent(EventForm);
    if (options.id) {
      fixture.componentRef.setInput('id', options.id);
    }
    element = fixture.nativeElement;
    fixture.autoDetectChanges();
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
    http.expectOne(`${environment.apiUrl}/api/me`).flush({
      user: {},
      memberships: [{ teamId: 't1', teamName: 'T', role: 'COACH', membershipId: 'm1' }],
    });
    await settle();
    if (options.event) {
      http.expectOne(EVENT_URL).flush(options.event);
      http
        .expectOne(`${EVENT_URL}/availability`)
        .flush({ yes: [], maybe: [], no: [], noAnswer: [] });
      await settle();
    }
  }

  function field<T extends HTMLElement>(name: string): T {
    return element.querySelector<T>(`[name="${name}"]`)!;
  }

  function fill(name: string, value: string): void {
    const input = field<HTMLInputElement>(name);
    input.value = value;
    input.dispatchEvent(new Event('input'));
    TestBed.tick();
  }

  function choose(name: string, value: string): void {
    const select = field<HTMLSelectElement>(name);
    select.value = value;
    select.dispatchEvent(new Event('change'));
    TestBed.tick();
  }

  function check(name: string): void {
    field<HTMLInputElement>(name).click();
    TestBed.tick();
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

  function submit(): void {
    element.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    TestBed.tick();
  }

  describe('create', () => {
    it('posts a valid training with ISO dates', async () => {
      await setup();

      fill('title', 'Treino de quinta');
      fill('startsAt', '2030-01-10T20:00');
      fill('endsAt', '2030-01-10T21:30');
      fill('location', 'Campo');
      submit();

      const post = http.expectOne((req) => req.method === 'POST' && req.url === EVENTS_URL);
      expect(post.request.body).toEqual({
        type: 'TRAINING',
        title: 'Treino de quinta',
        startsAt: new Date(2030, 0, 10, 20, 0).toISOString(),
        endsAt: new Date(2030, 0, 10, 21, 30).toISOString(),
        location: 'Campo',
      });
      post.flush(anEvent());
      await settle();
      http.expectOne((req) => req.url.includes('/api/teams/t1/events?')).flush([]);
      await settle();
      expect(navigate).toHaveBeenCalledWith(['/members']);
    });

    it('posts a custom event with notes and respond-by', async () => {
      await setup();

      choose('type', 'CUSTOM');
      fill('title', 'Jantar');
      fill('startsAt', '2030-01-10T20:00');
      fill('respondBy', '2030-01-09T12:00');
      fill('notes', 'Levar dinheiro');
      submit();

      const post = http.expectOne((req) => req.method === 'POST' && req.url === EVENTS_URL);
      expect(post.request.body).toEqual({
        type: 'CUSTOM',
        title: 'Jantar',
        startsAt: new Date(2030, 0, 10, 20, 0).toISOString(),
        respondBy: new Date(2030, 0, 9, 12, 0).toISOString(),
        notes: 'Levar dinheiro',
      });
    });

    it('does not post when the end is before the start', async () => {
      await setup();

      fill('title', 'Treino');
      fill('startsAt', '2030-01-10T20:00');
      fill('endsAt', '2030-01-10T19:00');
      submit();
      await settle();

      http.expectNone(EVENTS_URL);
      expect(element.textContent).toContain('O fim tem de ser depois do início');
      expect(field('endsAt').getAttribute('aria-invalid')).toBe('true');
    });

    it('does not post when respond-by is not before the start', async () => {
      await setup();

      fill('title', 'Treino');
      fill('startsAt', '2030-01-10T20:00');
      fill('respondBy', '2030-01-10T21:00');
      submit();
      await settle();

      http.expectNone(EVENTS_URL);
      expect(element.textContent).toContain('antes do início');
    });

    it('requires a title', async () => {
      await setup();

      fill('startsAt', '2030-01-10T20:00');
      submit();
      await settle();

      http.expectNone(EVENTS_URL);
      expect(element.textContent).toContain('Indica o título');
    });

    it('posts a weekly series to /series', async () => {
      await setup();

      fill('title', 'Treino semanal');
      fill('startsAt', '2030-01-10T20:00');
      fill('endsAt', '2030-01-10T21:30');
      fill('location', 'Campo');
      check('repeats');
      check('weekday-4');
      check('weekday-2');
      fill('repeatUntil', '2030-03-28');
      submit();

      const post = http.expectOne(
        (req) => req.method === 'POST' && req.url === `${EVENTS_URL}/series`,
      );
      expect(post.request.body).toEqual({
        title: 'Treino semanal',
        location: 'Campo',
        weekdays: [2, 4],
        startTime: '20:00',
        durationMinutes: 90,
        startDate: '2030-01-10',
        endDate: '2030-03-28',
      });
      http.expectNone(EVENTS_URL);
    });

    it('requires a weekday and an end date to repeat', async () => {
      await setup();

      fill('title', 'Treino semanal');
      fill('startsAt', '2030-01-10T20:00');
      check('repeats');
      submit();
      await settle();

      expect(element.textContent).toContain('Escolhe pelo menos um dia da semana');
      expect(element.textContent).toContain('Indica até quando repetir');
      http.expectNone(`${EVENTS_URL}/series`);
    });

    it('offers no repeat section for a custom event', async () => {
      await setup();

      choose('type', 'CUSTOM');

      expect(field('repeats')).toBeNull();
    });

    it('shows an error when saving fails', async () => {
      await setup();

      fill('title', 'Treino');
      fill('startsAt', '2030-01-10T20:00');
      submit();
      http
        .expectOne((req) => req.method === 'POST')
        .flush({}, { status: 400, statusText: 'Bad Request' });
      await settle();

      expect(element.querySelector('[role="alert"]')?.textContent).toContain('Não foi possível');
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe('edit', () => {
    it('prefills the form from the event', async () => {
      await setup({ id: 'e1', event: anEvent() });

      expect(field<HTMLInputElement>('title').value).toBe('Treino de quinta');
      expect(field<HTMLInputElement>('startsAt').value).toBe('2030-01-10T20:00');
      expect(field('repeats')).toBeNull();
    });

    it('patches only the changed fields and clears emptied ones', async () => {
      await setup({ id: 'e1', event: anEvent() });

      fill('title', 'Treino especial');
      fill('location', '');
      submit();

      const patch = http.expectOne((req) => req.method === 'PATCH' && req.url === EVENT_URL);
      expect(patch.request.body).toEqual({ title: 'Treino especial', location: null });
      patch.flush(anEvent());
      await settle();
      http.expectOne((req) => req.url.includes('/api/teams/t1/events?')).flush([]);
      await settle();
      expect(navigate).toHaveBeenCalledWith(['/members/events', 'e1']);
    });

    it('lets a game change only its notes', async () => {
      await setup({ id: 'e1', event: anEvent({ type: 'GAME', matchId: 'x' }) });

      expect(field<HTMLInputElement>('title').disabled).toBe(true);
      expect(field<HTMLInputElement>('startsAt').disabled).toBe(true);
      expect(field<HTMLTextAreaElement>('notes').disabled).toBe(false);
      fill('notes', 'Levar equipamento branco');
      submit();

      const patch = http.expectOne((req) => req.method === 'PATCH' && req.url === EVENT_URL);
      expect(patch.request.body).toEqual({ notes: 'Levar equipamento branco' });
    });

    it('cancels the event after a confirmation', async () => {
      await setup({ id: 'e1', event: anEvent() });

      button('Cancelar evento').click();
      TestBed.tick();
      http.expectNone(EVENT_URL);
      button('Confirmar cancelamento').click();
      TestBed.tick();

      const patch = http.expectOne((req) => req.method === 'PATCH' && req.url === EVENT_URL);
      expect(patch.request.body).toEqual({ status: 'CANCELED' });
    });

    it('does not offer cancel for a game or an already canceled event', async () => {
      await setup({ id: 'e1', event: anEvent({ status: 'CANCELED' }) });

      expect(
        Array.from(element.querySelectorAll('button')).some((b) =>
          b.textContent?.includes('Cancelar evento'),
        ),
      ).toBe(false);
    });
  });
});
