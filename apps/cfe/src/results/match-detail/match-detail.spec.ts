import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchStatus } from '@canarinhos/shared-types';
import { aMatch } from '../../shared/testing/match.fixture';
import { MatchDetail } from './match-detail';

describe('MatchDetail', () => {
  let fixture: ComponentFixture<MatchDetail>;
  let http: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MatchDetail],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(MatchDetail);
    fixture.componentRef.setInput('id', 'm7');
    fixture.autoDetectChanges();
  });

  it('loads the match for the id input and shows our result', async () => {
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 'away' });
    http
      .expectOne((req) => req.url.endsWith('/api/matches/m7'))
      .flush(
        aMatch({
          id: 'm7',
          journey: 5,
          status: MatchStatus.FINISHED,
          homeScore: 1,
          awayScore: 2,
          videoId: 'abcdefghijk',
        }),
      );
    await fixture.whenStable();
    const element: HTMLElement = fixture.nativeElement;

    expect(element.textContent).toContain('Jornada 5');
    expect(element.textContent).toContain('Vitória');
    const video = element.querySelector<HTMLAnchorElement>('a[target="_blank"]');
    expect(video?.href).toBe('https://www.youtube.com/watch?v=abcdefghijk');
  });

  it('shows an error when the match fails to load', async () => {
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 'away' });
    http
      .expectOne((req) => req.url.endsWith('/api/matches/m7'))
      .flush(null, { status: 500, statusText: 'Server Error' });
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain('Erro ao carregar jogo');
  });
});
