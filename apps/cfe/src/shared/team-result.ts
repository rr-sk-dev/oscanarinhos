import { Match, TeamResult } from '@canarinhos/shared-types';

/** Our result in a match, or null when it has no score or we did not play in it. */
export function teamResult(match: Match, ourTeamId: string | null | undefined): TeamResult | null {
  if (!ourTeamId || match.homeScore === null || match.awayScore === null) {
    return null;
  }
  const isHome = match.homeTeamId === ourTeamId;
  if (!isHome && match.awayTeamId !== ourTeamId) {
    return null;
  }
  if (match.homeScore === match.awayScore) {
    return TeamResult.DRAW;
  }
  const ourScore = isHome ? match.homeScore : match.awayScore;
  const theirScore = isHome ? match.awayScore : match.homeScore;
  return ourScore > theirScore ? TeamResult.WIN : TeamResult.LOSS;
}

export const RESULT_BADGE_CLASSES: Record<TeamResult, string> = {
  [TeamResult.WIN]: 'bg-cui-win-bg text-cui-win',
  [TeamResult.DRAW]: 'bg-cui-draw-bg text-cui-draw',
  [TeamResult.LOSS]: 'bg-cui-loss-bg text-cui-loss',
};
