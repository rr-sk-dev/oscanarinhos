import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../environments/environment';
import { StatsService } from './stats.service';

describe('StatsService', () => {
  afterEach(() => localStorage.clear());

  it('requests the season stats of the active team without a range', async () => {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const http = TestBed.inject(HttpTestingController);
    const service = TestBed.inject(StatsService);
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
    http.expectOne(`${environment.apiUrl}/api/me`).flush({
      user: {},
      memberships: [{ teamId: 't1', teamName: 'T', role: 'PLAYER', membershipId: 'm1' }],
    });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    const request = http.expectOne(`${environment.apiUrl}/api/teams/t1/stats`);
    request.flush({ members: [], byType: [] });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();

    expect(service.stats()).toEqual({ members: [], byType: [] });
  });
});
