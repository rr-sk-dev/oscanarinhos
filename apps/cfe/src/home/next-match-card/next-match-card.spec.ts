import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { aMatch } from '../../shared/testing/match.fixture';
import { NextMatchCard } from './next-match-card';

describe('NextMatchCard', () => {
  let fixture: ComponentFixture<NextMatchCard>;
  let element: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideRouter([])] });
    fixture = TestBed.createComponent(NextMatchCard);
    element = fixture.nativeElement;
  });

  it('shows the countdown before kickoff', async () => {
    fixture.componentRef.setInput('match', aMatch({ homeScore: null, awayScore: null }));
    fixture.componentRef.setInput('countdown', [{ value: '02', label: 'dias' }]);
    await fixture.whenStable();

    expect(element.textContent).toContain('VS');
    expect(element.textContent).toContain('dias');
    expect(element.textContent).toContain('Ver Transmissão');
  });

  it('shows the score and the live banner while live', async () => {
    fixture.componentRef.setInput('match', aMatch({ homeScore: 2, awayScore: 1 }));
    fixture.componentRef.setInput('isLive', true);
    await fixture.whenStable();

    expect(element.textContent).toContain('2 - 1');
    expect(element.textContent).toContain('Em Direto');
    expect(element.textContent).not.toContain('VS');
  });

  it('emits retry from the error state', async () => {
    let retries = 0;
    fixture.componentInstance.retry.subscribe(() => retries++);
    fixture.componentRef.setInput('error', 'Falha ao carregar próximo jogo');
    await fixture.whenStable();

    element.querySelector<HTMLButtonElement>('[role="alert"] button')!.click();
    expect(retries).toBe(1);
  });

  it('says so when there is no next match', async () => {
    await fixture.whenStable();

    expect(element.querySelector('h2')!.textContent).toContain('Sem Jogos Agendados');
  });
});
