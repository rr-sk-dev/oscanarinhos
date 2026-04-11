export interface Standing {
  id: string;
  season: string;
  competition: string;
  position: number;
  teamName: string;
  teamLogo: string | null;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface StandingContext {
  team: Standing;
  above: Standing | null;
  below: Standing | null;
}
