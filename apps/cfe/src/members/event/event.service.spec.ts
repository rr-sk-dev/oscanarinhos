import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { EventService } from './event.service';

describe('EventService', () => {
  let http: HttpTestingController;
  let service: EventService;

  beforeEach(async () => {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), EventService],
    });
    http = TestBed.inject(HttpTestingController);
    service = TestBed.inject(EventService);
    service.eventId.set('e1');
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
    http.expectOne(`${environment.apiUrl}/api/me`).flush({
      user: {},
      memberships: [{ teamId: 't1', teamName: 'T', role: 'PLAYER', membershipId: 'm1' }],
    });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  });

  afterEach(() => localStorage.clear());

  it('loads the event and the summary for the active team', () => {
    http.expectOne(`${environment.apiUrl}/api/teams/t1/events/e1`);
    http.expectOne(`${environment.apiUrl}/api/teams/t1/events/e1/availability`);
    expect(service.summary()).toEqual({ yes: [], maybe: [], no: [], noAnswer: [] });
  });

  it('exposes a null event and a 404 flag when the event is missing', async () => {
    http
      .expectOne(`${environment.apiUrl}/api/teams/t1/events/e1`)
      .flush({}, { status: 404, statusText: 'Not Found' });
    http.expectOne(`${environment.apiUrl}/api/teams/t1/events/e1/availability`).flush(
      {},
      {
        status: 404,
        statusText: 'Not Found',
      },
    );
    await Promise.resolve();
    expect(service.event()).toBeUndefined();
    expect(service.isNotFound()).toBe(true);
  });
});
