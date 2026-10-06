import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatchStatus } from '@canarinhos/shared-types';
import { aMatch } from '../shared/testing/match.fixture';
import { Home } from './home';

describe('Home', () => {
  let fixture: ComponentFixture<Home>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Home);
    fixture.autoDetectChanges();
  });

  function respond(urlPart: string, body: object | null, failed = false): void {
    const request = http.expectOne((req) => req.url.includes(urlPart));
    if (failed) {
      request.flush(null, { status: 500, statusText: 'Server Error' });
    } else {
      request.flush(body);
    }
  }

  it('keeps rendering the other sections when one endpoint fails', async () => {
    respond('/details', null, true);
    respond('/api/matches/next/', null, true);
    respond('/api/matches/results/', null, true);
    respond('/api/matches/upcoming/', [], true);
    respond('/api/standings/', null, true);
    respond('/api/testimonials', null, true);
    respond('/api/news', [
      { id: 'n1', slug: 'vitoria', title: 'Grande vitória', image: null, publishedAt: null },
    ]);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('Falha ao carregar próximo jogo');
    expect(element.textContent).toContain('Grande vitória');
  });

  it('links recent results to their match page', async () => {
    respond('/details', { id: 'home' });
    respond('/api/matches/next/', null);
    respond('/api/matches/results/', [
      aMatch({ id: 'm9', status: MatchStatus.FINISHED, homeScore: 2, awayScore: 0 }),
    ]);
    respond('/api/matches/upcoming/', []);
    respond('/api/standings/', null);
    respond('/api/testimonials', []);
    respond('/api/news', []);
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    const card = element.querySelector<HTMLAnchorElement>('a.result-card');
    expect(card?.getAttribute('href')).toBe('/matches/m9');
    expect(card?.textContent).toContain('Vitória');
  });
});
