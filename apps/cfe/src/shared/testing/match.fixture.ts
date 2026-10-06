import { Match, MatchStatus } from '@canarinhos/shared-types';

/** A test match between teams "home" and "away"; override any field. */
export function aMatch(overrides: Partial<Match> = {}): Match {
  return {
    id: 'm1',
    journey: 3,
    kickoffAt: '2026-09-19T17:50:00.000Z',
    label: '',
    status: MatchStatus.SCHEDULED,
    homeTeamId: 'home',
    awayTeamId: 'away',
    homeScore: null,
    awayScore: null,
    location: null,
    videoId: null,
    createdAt: '',
    updatedAt: '',
    ...overrides,
  };
}
