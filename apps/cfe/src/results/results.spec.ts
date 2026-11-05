import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MatchStatus, Standing } from '@canarinhos/shared-types';
import { aMatch } from '../shared/testing/match.fixture';
import { groupByMonth, Results } from './results';

describe('groupByMonth', () => {
  it('groups by local calendar month, keeping order', () => {
    // A late-night kickoff on the last day of the month stays in that month even when it is
    // the next month in UTC.
    const lastNight = new Date(2026, 8, 30, 23, 30).toISOString();
    const midMonth = new Date(2026, 8, 19, 15, 0).toISOString();
    const nextMonth = new Date(2026, 9, 3, 10, 0).toISOString();

    const groups = groupByMonth(
      [
        aMatch({ id: 'a', kickoffAt: lastNight }),
        aMatch({ id: 'b', kickoffAt: midMonth }),
        aMatch({ id: 'c', kickoffAt: nextMonth }),
      ],
      'pt-PT',
    );

    expect(groups.map((g) => g.key)).toEqual(['2026-09', '2026-10']);
    expect(groups[0].matches.map((m) => m.id)).toEqual(['a', 'b']);
    expect(groups[0].label).toBe('setembro de 2026');
  });
});

describe('Results', () => {
  let fixture: ComponentFixture<Results>;
  let http: HttpTestingController;
  let element: HTMLElement;

  const standing = (position: number, teamName: string): Standing =>
    ({ position, teamName, teamLogo: null, points: 20 - position, goalDifference: 0 }) as Standing;

  async function setup(tab?: string): Promise<void> {
    await TestBed.configureTestingModule({
      imports: [Results],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Results);
    if (tab) {
      fixture.componentRef.setInput('tab', tab);
    }
    element = fixture.nativeElement;
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
    http
      .expectOne((req) => /\/api\/standings\/[^/]+$/.test(req.url))
      .flush([standing(1, 'Leões'), standing(2, 'Canarinhos'), standing(3, 'Tigres')]);
    await fixture.whenStable();
  }

  afterEach(() => http.verify());

  it('opens on upcoming matches', async () => {
    await setup();

    const selected = element.querySelector('[role="tab"][aria-selected="true"]');
    expect(selected?.textContent).toContain('Próximos');
    expect(element.textContent).toContain('Sem jogos agendados');
  });

  it('shows our result and links to the match video', async () => {
    await setup('resultados');

    expect(element.textContent).toContain('Vitória');
    const video = element.querySelector<HTMLAnchorElement>(
      'a[aria-label="Ver transmissão no YouTube"]',
    );
    expect(video?.href).toBe('https://www.youtube.com/watch?v=abcdefghijk');
    expect(video?.target).toBe('_blank');
  });

  it('shows the full table with our row marked', async () => {
    await setup();

    element.querySelector<HTMLButtonElement>('#tab-tabela')!.click();
    await fixture.whenStable();

    const rows = element.querySelectorAll('tbody tr');
    expect(rows.length).toBe(3);
    expect(element.querySelector('tr[aria-current="true"]')?.textContent).toContain('Canarinhos');
    expect(element.textContent).toContain('2.º');
  });

  it('moves between tabs with the arrow keys', async () => {
    await setup();

    const first = element.querySelector<HTMLButtonElement>('#tab-proximos')!;
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
    await fixture.whenStable();

    expect(element.querySelector('#tab-tabela')?.getAttribute('aria-selected')).toBe('true');
  });
});
