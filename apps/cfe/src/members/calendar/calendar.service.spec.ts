import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { CalendarService } from './calendar.service';

describe('CalendarService', () => {
  let http: HttpTestingController;
  let service: CalendarService;

  beforeEach(() => {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(CalendarService);
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
  });

  afterEach(() => localStorage.clear());

  it('defaults the range to today through 60 days ahead', () => {
    const { from, to } = service.range();
    expect(from.getHours()).toBe(0);
    expect(from.getMinutes()).toBe(0);
    expect(from.getSeconds()).toBe(0);
    expect(from.getMilliseconds()).toBe(0);
    expect(Math.round((to.getTime() - from.getTime()) / 86_400_000)).toBe(60);
  });

  it('keeps a custom range until the default one is requested again', () => {
    const custom = { from: new Date(2026, 9, 26), to: new Date(2026, 11, 7) };
    service.useRange(custom);
    service.reload();
    expect(service.range()).toBe(custom);

    service.useDefaultRange();
    const { from, to } = service.range();
    expect(service.range()).not.toBe(custom);
    expect(Math.round((to.getTime() - from.getTime()) / 86_400_000)).toBe(60);
  });

  describe('when the app stays open across days', () => {
    async function signInWithMembership(): Promise<void> {
      http.expectOne(`${environment.apiUrl}/api/me`).flush({
        user: {},
        memberships: [{ teamId: 't1', teamName: 'T', role: 'PLAYER', membershipId: 'm1' }],
      });
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();
      http.expectOne((req) => req.url.includes('/events')).flush([]);
    }

    afterEach(() => {
      vi.useRealTimers();
      vi.restoreAllMocks();
    });

    function expectedFromAfter(now: Date): string {
      const from = new Date(now);
      from.setHours(0, 0, 0, 0);
      return encodeURIComponent(from.toISOString());
    }

    function setVisibility(state: DocumentVisibilityState): void {
      vi.spyOn(document, 'visibilityState', 'get').mockReturnValue(state);
      document.dispatchEvent(new Event('visibilitychange'));
    }

    it('moves the default window to the new day when the app resumes after a long time hidden', async () => {
      vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
      await signInWithMembership();

      setVisibility('hidden');
      const twoDaysLater = new Date(Date.now() + 2 * 86_400_000);
      vi.setSystemTime(twoDaysLater);
      setVisibility('visible');
      TestBed.tick();

      const request = http.expectOne((req) => req.url.includes('/events'));
      expect(request.request.url).toContain(expectedFromAfter(twoDaysLater));
      request.flush([]);
    });

    it('moves the default window to the new day when the device comes back online', async () => {
      vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
      await signInWithMembership();

      const twoDaysLater = new Date(Date.now() + 2 * 86_400_000);
      vi.setSystemTime(twoDaysLater);
      window.dispatchEvent(new Event('online'));
      TestBed.tick();

      const request = http.expectOne((req) => req.url.includes('/events'));
      expect(request.request.url).toContain(expectedFromAfter(twoDaysLater));
      request.flush([]);
    });

    it('moves the default window to the new day on reload with a single request', async () => {
      vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
      await signInWithMembership();
      const firstFrom = service.range().from;

      const twoDaysLater = new Date(Date.now() + 2 * 86_400_000);
      vi.setSystemTime(twoDaysLater);
      service.reload();
      TestBed.tick();

      const request = http.expectOne((req) => req.url.includes('/events'));
      const expectedFrom = new Date(twoDaysLater);
      expectedFrom.setHours(0, 0, 0, 0);
      expect(request.request.url).toContain(encodeURIComponent(expectedFrom.toISOString()));
      expect(service.range().from.getTime()).toBe(expectedFrom.getTime());
      expect(service.range().from.getTime()).toBeGreaterThan(firstFrom.getTime());
      request.flush([]);
    });

    it('does not overwrite a customised range on reload', async () => {
      vi.useFakeTimers({ toFake: ['Date'], now: Date.now() });
      await signInWithMembership();
      // "Customised" is identity-based: any range.set() replaces the default object.
      const custom = { from: new Date(2026, 0, 1), to: new Date(2026, 1, 1) };
      service.range.set(custom);
      TestBed.tick();
      http.expectOne((req) => req.url.includes('/events')).flush([]);
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();

      vi.setSystemTime(new Date(Date.now() + 2 * 86_400_000));
      service.reload();
      await new Promise((resolve) => setTimeout(resolve));
      TestBed.tick();

      expect(service.range()).toBe(custom);
      const request = http.expectOne((req) => req.url.includes('/events'));
      expect(request.request.url).toContain(encodeURIComponent(custom.from.toISOString()));
      expect(request.request.url).toContain(encodeURIComponent(custom.to.toISOString()));
      request.flush([]);
    });
  });

  it('makes no events request while there is no active membership', async () => {
    http.expectOne(`${environment.apiUrl}/api/me`).flush({ user: {}, memberships: [] });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    http.expectNone((req) => req.url.includes('/events'));
    expect(service.events()).toEqual([]);
  });

  it('exposes a Portuguese error message when the request fails', async () => {
    http.expectOne(`${environment.apiUrl}/api/me`).flush({
      user: {},
      memberships: [{ teamId: 't1', teamName: 'T', role: 'PLAYER', membershipId: 'm1' }],
    });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    http
      .expectOne((req) => req.url.includes('/api/teams/t1/events'))
      .flush({}, { status: 500, statusText: 'Server Error' });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    expect(service.error()).toBe('Falha ao carregar o calendário');
    expect(service.events()).toEqual([]);
  });
});
