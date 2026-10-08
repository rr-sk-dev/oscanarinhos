import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { LeadershipRole, PlayerPosition, PlayerStatus, StaffRole } from '@canarinhos/shared-types';
import { aPlayer, aStaffMember } from '../shared/testing/people.fixture';
import { Squad } from './squad';

describe('Squad', () => {
  let fixture: ComponentFixture<Squad>;
  let http: HttpTestingController;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    });
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(Squad);
    element = fixture.nativeElement;
  });

  async function load(): Promise<void> {
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/api/players'))
      .flush([
        aPlayer({ id: 'f9', firstName: 'Avançado', position: PlayerPosition.FWD, shirtNumber: 9 }),
        aPlayer({ id: 'm8', firstName: 'Oito', position: PlayerPosition.MID, shirtNumber: 8 }),
        aPlayer({
          id: 'm6',
          firstName: 'Seis',
          position: PlayerPosition.MID,
          shirtNumber: 6,
          leadershipRole: LeadershipRole.CAPTAIN,
          status: PlayerStatus.INJURED,
        }),
        aPlayer({ id: 'g1', firstName: 'Guarda', position: PlayerPosition.GK, shirtNumber: 1 }),
      ]);
    http
      .expectOne((req) => req.url.endsWith('/api/team-staff'))
      .flush([
        aStaffMember({ id: 'd', firstName: 'Delegado', role: StaffRole.DELEGATE }),
        aStaffMember({ id: 'c', firstName: 'Treinador', role: StaffRole.COACH }),
      ]);
    await fixture.whenStable();
  }

  it('groups players by position in pitch order, sorted by shirt number', async () => {
    await load();

    const groups = Array.from(element.querySelectorAll('section h2')).map((h) =>
      h.textContent?.trim(),
    );
    expect(groups).toEqual(['Guarda-Redes', 'Médios', 'Avançados', 'Equipa Técnica']);

    const midfield = element.querySelector('#squad-group-MID')!.closest('section')!;
    const names = Array.from(midfield.querySelectorAll('a')).map((a) => a.textContent);
    expect(names[0]).toContain('Seis');
    expect(names[1]).toContain('Oito');
  });

  it('marks the captain and unavailable players', async () => {
    await load();
    const captain = element.querySelector<HTMLAnchorElement>('a[href="/squad/m6"]')!;

    expect(captain.textContent).toContain('C');
    expect(captain.textContent).toContain('Lesionado');
  });

  it('lists the staff by role, coach first', async () => {
    await load();
    const staff = Array.from(element.querySelectorAll('a[href^="/staff/"]')).map(
      (a) => a.textContent,
    );

    expect(staff[0]).toContain('Treinador');
    expect(staff[1]).toContain('Delegado');
  });
});
