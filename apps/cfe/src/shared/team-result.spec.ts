import { TeamResult } from '@canarinhos/shared-types';
import { teamResult } from './team-result';
import { aMatch } from './testing/match.fixture';

describe('teamResult', () => {
  it('is a win, draw or loss from our side when we play at home', () => {
    expect(teamResult(aMatch({ homeScore: 2, awayScore: 1 }), 'home')).toBe(TeamResult.WIN);
    expect(teamResult(aMatch({ homeScore: 1, awayScore: 1 }), 'home')).toBe(TeamResult.DRAW);
    expect(teamResult(aMatch({ homeScore: 0, awayScore: 3 }), 'home')).toBe(TeamResult.LOSS);
  });

  it('is a win, draw or loss from our side when we play away', () => {
    expect(teamResult(aMatch({ homeScore: 0, awayScore: 3 }), 'away')).toBe(TeamResult.WIN);
    expect(teamResult(aMatch({ homeScore: 2, awayScore: 1 }), 'away')).toBe(TeamResult.LOSS);
  });

  it('is null without a score, without our team id, or when we did not play', () => {
    expect(teamResult(aMatch(), 'home')).toBeNull();
    expect(teamResult(aMatch({ homeScore: 2, awayScore: 1 }), null)).toBeNull();
    expect(teamResult(aMatch({ homeScore: 2, awayScore: 1 }), 'other')).toBeNull();
  });
});
