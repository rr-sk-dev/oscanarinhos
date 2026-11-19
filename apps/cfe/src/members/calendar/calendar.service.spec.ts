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
    expect(Math.round((to.getTime() - from.getTime()) / 86_400_000)).toBe(60);
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
