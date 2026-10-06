/**
 * Single source of truth for the season the API serves and the scrapers write.
 * Standings and scorers are stored under this label, and cfe requests it.
 */
export const CURRENT_SEASON = '2026-27';

const seasonStartYear = Number(CURRENT_SEASON.slice(0, 4));

export const COMPETITION_LABEL = `Torneio CIF ${CURRENT_SEASON.replace('-', '/')}`;

/** Our team's name as cif.org.pt writes it. */
export const OUR_TEAM_NAME = 'Canarinhos';

/**
 * Matches carry no season, so a season is the kickoffs between two Augusts.
 * This keeps journey numbers from colliding with previous seasons' matches.
 */
export const CURRENT_SEASON_KICKOFFS = {
  kickoffFrom: new Date(Date.UTC(seasonStartYear, 7, 1)),
  kickoffTo: new Date(Date.UTC(seasonStartYear + 1, 7, 1)),
};

// cif.org.pt always serves the current season whatever the slug says,
// but we keep the URL in step with the season so the intent is explicit.
const CIF_TOURNAMENT_URL = `https://www.cif.org.pt/futebol/torneio-cif-${seasonStartYear}-${seasonStartYear + 1}`;

export const CIF_RESULTS_URL = `${CIF_TOURNAMENT_URL}/resultados`;
export const CIF_STANDINGS_URL = `${CIF_TOURNAMENT_URL}/classificacao`;
export const CIF_SCORERS_URL = `${CIF_TOURNAMENT_URL}/marcadores`;
