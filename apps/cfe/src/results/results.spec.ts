import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatchStatus } from '@canarinhos/shared-types';
import { aMatch } from '../shared/testing/match.fixture';
import { groupByDate, Results } from './results';

describe('groupByDate', () => {
  it('groups by local calendar day, keeping order', () => {
    // A late-night kickoff stays on its local day even when it is the next day in UTC.
    const lateNight = new Date(2026, 8, 19, 23, 30).toISOString();
    const afternoon = new Date(2026, 8, 19, 15, 0).toISOString();
    const nextDay = new Date(2026, 8, 20, 10, 0).toISOString();

    const groups = groupByDate(
      [
        aMatch({ id: 'a', kickoffAt: lateNight }),
        aMatch({ id: 'b', kickoffAt: afternoon }),
        aMatch({ id: 'c', kickoffAt: nextDay }),
      ],
      'pt-PT',
    );

    expect(groups.map((g) => g.key)).toEqual(['2026-09-19', '2026-09-20']);
    expect(groups[0].matches.map((m) => m.id)).toEqual(['a', 'b']);
    expect(groups[0].label).toContain('19 DE SETEMBRO DE 2026');
  });
});

describe('Results', () => {
  let fixture: ComponentFixture<Results>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Results],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Results);
    fixture.autoDetectChanges();

    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 'home' });
    http.expectOne((req) => req.url.includes('/api/matches/upcoming/')).flush([]);
    http
      .expectOne((req) => req.url.includes('/api/matches/results/'))
      .flush([
        aMatch({
          id: 'won',
          status: MatchStatus.FINISHED,
          homeScore: 3,
          awayScore: 1,
          videoId: 'abcdefghijk',
        }),
      ]);
    await fixture.whenStable();
  });

  afterEach(() => http.verify());

  it('shows our result and links to the match video', () => {
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('Vitória');
    const video = element.querySelector<HTMLAnchorElement>(
      'a[aria-label="Ver transmissão no YouTube"]',
    );
    expect(video?.href).toBe('https://www.youtube.com/watch?v=abcdefghijk');
    expect(video?.target).toBe('_blank');
  });

  it('switches to upcoming matches with pressed-state buttons', async () => {
    const element: HTMLElement = fixture.nativeElement;
    const [upcoming, results] = Array.from(element.querySelectorAll('button[aria-pressed]'));
    expect(results.getAttribute('aria-pressed')).toBe('true');

    (upcoming as HTMLButtonElement).click();
    await fixture.whenStable();

    expect(upcoming.getAttribute('aria-pressed')).toBe('true');
    expect(element.textContent).toContain('Sem jogos agendados');
  });
});
