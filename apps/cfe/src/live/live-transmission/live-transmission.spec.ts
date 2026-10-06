import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { aMatch } from '../../shared/testing/match.fixture';
import { LiveTransmission } from './live-transmission';

describe('LiveTransmission', () => {
  let fixture: ComponentFixture<LiveTransmission>;
  let http: HttpTestingController;

  beforeEach(async () => {
    jasmine.clock().install();
    await TestBed.configureTestingModule({
      imports: [LiveTransmission],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => jasmine.clock().uninstall());

  async function renderAt(now: number, kickoffAt: string): Promise<HTMLElement> {
    jasmine.clock().mockDate(new Date(now));
    fixture = TestBed.createComponent(LiveTransmission);
    fixture.autoDetectChanges();
    http
      .expectOne((req) => req.url.includes('/api/matches/upcoming/'))
      .flush([aMatch({ kickoffAt })]);
    http.expectOne((req) => req.url.includes('/api/matches/results/')).flush([]);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  it('moves from "em breve" to "em direto" while the page stays open', async () => {
    const kickoff = Date.parse('2026-09-19T17:50:00.000Z');
    const element = await renderAt(kickoff - 60_000, '2026-09-19T17:50:00.000Z');
    expect(element.textContent).toContain('EM BREVE');

    // The page clock ticks every 30s; two ticks later kickoff has passed.
    jasmine.clock().tick(60_000);
    await fixture.whenStable();

    expect(element.textContent).toContain('EM DIRETO');
  });
});
