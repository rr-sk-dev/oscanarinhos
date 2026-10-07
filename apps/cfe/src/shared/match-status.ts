import { Match, MatchStatus } from '@canarinhos/shared-types';

export type LiveStatus = 'live' | 'soon' | 'upcoming';

/** How long after kickoff a scheduled match counts as live, and how long before as "soon". */
export const LIVE_WINDOW_MS = 2 * 60 * 60 * 1000;

/**
 * Whether a match is being played at `now`. The API rarely sets IN_PROGRESS, so a scheduled
 * match also counts as live during the window after kickoff, and as "soon" in the one before.
 */
export function liveStatus(match: Match, now: number): LiveStatus {
  if (match.status === MatchStatus.IN_PROGRESS) {
    return 'live';
  }
  const kickoff = Date.parse(match.kickoffAt);
  if (match.status !== MatchStatus.SCHEDULED || isNaN(kickoff)) {
    return 'upcoming';
  }
  if (now >= kickoff && now <= kickoff + LIVE_WINDOW_MS) {
    return 'live';
  }
  if (now >= kickoff - LIVE_WINDOW_MS && now < kickoff) {
    return 'soon';
  }
  return 'upcoming';
}

/** Kickoff time in ms, or null when the match has no valid kickoff. */
export function kickoffTime(match: Match | null | undefined): number | null {
  const kickoff = match ? Date.parse(match.kickoffAt) : NaN;
  return isNaN(kickoff) ? null : kickoff;
}
