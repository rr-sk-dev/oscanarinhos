import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TeamStats } from '@canarinhos/shared-types';
import { environment } from '../../environments/environment';
import { Stats } from './stats';

const stats: TeamStats = {
  members: [
    {
      membershipId: 'm2',
      displayName: 'Zé',
      role: 'PLAYER',
      markedEvents: 0,
      attended: 0,
      attendancePercent: 0,
    },
    {
      membershipId: 'm1',
      displayName: 'Ana',
      role: 'PLAYER',
      markedEvents: 3,
      attended: 2,
      attendancePercent: 67,
    },
    {
      membershipId: 'm3',
      displayName: 'Álvaro',
      role: 'COACH',
      markedEvents: 4,
      attended: 4,
      attendancePercent: 100,
    },
  ],
  byType: [{ type: 'TRAINING', events: 3, averageAttended: 12.5 }],
};

describe('Stats', () => {
  let fixture: ComponentFixture<Stats>;
  let http: HttpTestingController;
  let element: HTMLElement;

  async function setup(response: TeamStats | 500): Promise<void> {
    localStorage.setItem('canarinhos.accessToken', 'tok');
    await TestBed.configureTestingModule({
      imports: [Stats],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Stats);
    element = fixture.nativeElement;
    fixture.autoDetectChanges();
    TestBed.tick();
    http.expectOne((req) => req.url.endsWith('/details')).flush({ id: 't1' });
    http.expectOne(`${environment.apiUrl}/api/me`).flush({
      user: {},
      memberships: [{ teamId: 't1', teamName: 'T', role: 'PLAYER', membershipId: 'm1' }],
    });
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
    const request = http.expectOne(`${environment.apiUrl}/api/teams/t1/stats`);
    if (response === 500) {
      request.flush({}, { status: 500, statusText: 'Server Error' });
    } else {
      request.flush(response);
    }
    await fixture.whenStable();
  }

  afterEach(() => localStorage.clear());

  it('shows the percentage and attended/marked for a member', async () => {
    await setup(stats);

    const row = element.querySelector('[data-member="m1"]')!;
    expect(row.textContent).toContain('67%');
    expect(row.textContent).toContain('2/3');
  });

  it('shows 0% with an explanation when nothing was marked', async () => {
    await setup(stats);

    const row = element.querySelector('[data-member="m2"]')!;
    expect(row.textContent).toContain('0%');
    expect(row.textContent).toContain('Sem presenças registadas');
  });

  it('sorts members alphabetically by name', async () => {
    await setup(stats);

    const names = Array.from(element.querySelectorAll('[data-member] [data-name]')).map((n) =>
      n.textContent?.trim(),
    );
    expect(names).toEqual(['Álvaro', 'Ana', 'Zé']);
  });

  it('shows the average turnout by event type', async () => {
    await setup(stats);

    const row = element.querySelector('[data-type="TRAINING"]')!;
    expect(row.textContent).toContain('Treino');
    expect(row.textContent).toContain('12,5');
  });

  it('shows an error state on failure', async () => {
    await setup(500);

    expect(element.querySelector('cui-error-state')).not.toBeNull();
  });
});
