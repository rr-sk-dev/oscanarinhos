import { MatchStatus } from '@canarinhos/shared-types';
import { kickoffTime, LIVE_WINDOW_MS, liveStatus } from './match-status';
import { aMatch } from './testing/match.fixture';

describe('liveStatus', () => {
  const kickoffAt = '2026-09-19T17:50:00.000Z';
  const kickoff = Date.parse(kickoffAt);
  const match = aMatch({ kickoffAt });

  it('is upcoming more than two hours before kickoff', () => {
    expect(liveStatus(match, kickoff - LIVE_WINDOW_MS - 1)).toBe('upcoming');
  });

  it('is soon in the two hours before kickoff', () => {
    expect(liveStatus(match, kickoff - 60_000)).toBe('soon');
  });

  it('is live from kickoff until two hours later', () => {
    expect(liveStatus(match, kickoff)).toBe('live');
    expect(liveStatus(match, kickoff + LIVE_WINDOW_MS)).toBe('live');
    expect(liveStatus(match, kickoff + LIVE_WINDOW_MS + 1)).toBe('upcoming');
  });

  it('is live whenever the API says IN_PROGRESS', () => {
    const inProgress = aMatch({ kickoffAt, status: MatchStatus.IN_PROGRESS });
    expect(liveStatus(inProgress, kickoff - 10 * LIVE_WINDOW_MS)).toBe('live');
  });

  it('is never live for a finished or postponed match', () => {
    expect(liveStatus(aMatch({ kickoffAt, status: MatchStatus.FINISHED }), kickoff)).toBe(
      'upcoming',
    );
    expect(liveStatus(aMatch({ kickoffAt, status: MatchStatus.POSTPONED }), kickoff)).toBe(
      'upcoming',
    );
  });
});

describe('kickoffTime', () => {
  it('parses the kickoff, or returns null when missing or invalid', () => {
    expect(kickoffTime(aMatch({ kickoffAt: '2026-09-19T17:50:00.000Z' }))).toBe(
      Date.parse('2026-09-19T17:50:00.000Z'),
    );
    expect(kickoffTime(aMatch({ kickoffAt: 'not a date' }))).toBeNull();
    expect(kickoffTime(null)).toBeNull();
  });
});
