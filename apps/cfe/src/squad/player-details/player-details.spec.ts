import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  LeadershipRole,
  Player,
  PlayerFoot,
  PlayerPosition,
  PlayerStatus,
} from '@canarinhos/shared-types';
import { PlayerDetails } from './player-details';

const player: Player = {
  id: 'p1',
  firstName: 'João',
  lastName: 'Silva',
  fullName: '',
  nickname: null,
  shirtNumber: 10,
  position: PlayerPosition.MID,
  preferredFoot: PlayerFoot.LEFT,
  dateOfBirth: '1990-05-12T00:00:00.000Z',
  photo: null,
  status: PlayerStatus.INJURED,
  leadershipRole: LeadershipRole.CAPTAIN,
  teamId: 't1',
  createdAt: '',
  updatedAt: '',
};

describe('PlayerDetails', () => {
  let fixture: ComponentFixture<PlayerDetails>;
  let http: HttpTestingController;

  async function render(id: string, players: Player[]): Promise<HTMLElement> {
    fixture = TestBed.createComponent(PlayerDetails);
    fixture.componentRef.setInput('id', id);
    fixture.autoDetectChanges();
    http.expectOne((req) => req.url.endsWith('/api/players')).flush(players);
    await fixture.whenStable();
    return fixture.nativeElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlayerDetails],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();
    http = TestBed.inject(HttpTestingController);
  });

  it('shows the player from the route id', async () => {
    const element = await render('p1', [player]);

    expect(element.querySelector('h1')?.textContent).toContain('João');
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('João Silva');
    expect(element.textContent).toContain('Capitão');
    expect(element.textContent).toContain('Médio');
    expect(element.textContent).toContain('Esquerdo');
    expect(element.textContent).toContain('12/05/1990');
    expect(element.textContent).toContain('Lesionado');
  });

  it('reports an unknown player', async () => {
    const element = await render('missing', [player]);

    expect(element.textContent).toContain('Jogador não encontrado');
  });
});
