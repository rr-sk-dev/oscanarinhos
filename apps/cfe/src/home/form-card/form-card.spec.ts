import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatchStatus, Standing } from '@canarinhos/shared-types';
import { aMatch } from '../../shared/testing/match.fixture';
import { FormCard } from './form-card';

describe('FormCard', () => {
  let fixture: ComponentFixture<FormCard>;
  let element: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(FormCard);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('ourTeamId', 'home');
  });

  const finished = (id: string, homeScore: number, awayScore: number) =>
    aMatch({ id, status: MatchStatus.FINISHED, homeScore, awayScore });

  it('lists the last five results oldest first', async () => {
    // Newest first, as the API returns them.
    fixture.componentRef.setInput('matches', [
      finished('m6', 3, 1),
      finished('m5', 2, 2),
      finished('m4', 0, 1),
      finished('m3', 1, 0),
      finished('m2', 4, 2),
      finished('m1', 0, 3),
    ]);
    await fixture.whenStable();

    const letters = Array.from(element.querySelectorAll('li')).map((li) => li.textContent?.trim());
    expect(letters).toEqual(['V', 'V', 'D', 'E', 'V']);
  });

  it('shows our position and points', async () => {
    fixture.componentRef.setInput('matches', [finished('m1', 1, 0)]);
    fixture.componentRef.setInput('standing', { position: 3, points: 13 } as Standing);
    await fixture.whenStable();

    expect(element.textContent).toContain('3.º lugar · 13 pts');
  });

  it('renders nothing without results', async () => {
    fixture.componentRef.setInput('matches', []);
    await fixture.whenStable();

    expect(element.textContent?.trim()).toBe('');
  });
});
