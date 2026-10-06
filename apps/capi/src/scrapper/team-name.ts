/**
 * Normalizes a team name for comparison:
 * lowercases, strips diacritics, removes ALL non-alphanumeric characters (incl. spaces).
 * "SD 76" → "sd76", "Pé Leve" → "peleve", "Amigos CDUL" → "amigoscdul"
 */
export function normalizeTeamName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function isSameTeam(a: string, b: string): boolean {
  return normalizeTeamName(a) === normalizeTeamName(b);
}
