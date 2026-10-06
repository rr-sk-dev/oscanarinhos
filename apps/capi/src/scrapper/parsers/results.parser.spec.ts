import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { isPlayed, parseDayHeading, parseResultsPage } from './results.parser';

const LOGOS = 'https://www.cif.org.pt/Assets/img/decor/logos/256';

const fixture = (name: string): string =>
  readFileSync(join(__dirname, '__fixtures__', name), 'utf8');

describe('parseResultsPage', () => {
  describe('journey 1 (played, with one match without result)', () => {
    const matches = parseResultsPage(fixture('results-journey-1.html'));

    it('parses every match of the journey', () => {
      expect(matches).toHaveLength(9);
    });

    it('parses a Friday night match with its score and kickoff', () => {
      expect(matches[0]).toEqual({
        homeTeamName: 'Laranjada',
        awayTeamName: 'Vips',
        homeTeamLogo: `${LOGOS}/laranjada.png`,
        awayTeamLogo: `${LOGOS}/vips.png`,
        homeScore: 1,
        awayScore: 4,
        // Friday 18 September 2026, 21:30 in Lisbon (UTC+1 in summer)
        kickoffAt: new Date('2026-09-18T20:30:00Z'),
      });
    });

    it('assigns each match to the day heading above it', () => {
      const sunday = matches.find((m) => m.homeTeamName === 'Leões');
      expect(sunday?.kickoffAt).toEqual(new Date('2026-09-20T11:40:00Z'));
    });

    it('keeps a match without result, with null scores and its kickoff', () => {
      const unplayed = matches.find((m) => m.awayTeamName === 'Canarinhos');
      expect(unplayed).toEqual({
        homeTeamName: 'Madeirinha',
        awayTeamName: 'Canarinhos',
        homeTeamLogo: `${LOGOS}/madeirinha.png`,
        awayTeamLogo: `${LOGOS}/canarinhos.png`,
        homeScore: null,
        awayScore: null,
        kickoffAt: new Date('2026-09-19T17:50:00Z'),
      });
      expect(unplayed && isPlayed(unplayed)).toBe(false);
    });

    it('treats the other matches as played', () => {
      expect(matches.filter(isPlayed)).toHaveLength(8);
    });
  });

  describe('journey 4 (not played yet)', () => {
    const matches = parseResultsPage(fixture('results-journey-4.html'));

    it('parses the fixtures with no results', () => {
      expect(matches).toHaveLength(9);
      expect(matches.some(isPlayed)).toBe(false);
    });

    it('includes the new team', () => {
      expect(matches).toContainEqual(
        expect.objectContaining({
          homeTeamName: 'Madeirinha',
          awayTeamName: 'VDR',
          awayTeamLogo: `${LOGOS}/vdr.png`,
        }),
      );
    });
  });

  it('returns no matches for an unrelated page', () => {
    expect(parseResultsPage('<html><body><h1>Página não encontrada</h1></body></html>')).toEqual(
      [],
    );
  });
});

describe('parseDayHeading', () => {
  it.each([
    ['Sexta-Feira, 18 Setembro 2026', { year: 2026, month: 9, day: 18 }],
    ['Sábado, 3 Outubro 2026', { year: 2026, month: 10, day: 3 }],
    ['Domingo, 7 Março 2027', { year: 2027, month: 3, day: 7 }],
  ])('parses "%s"', (heading, expected) => {
    expect(parseDayHeading(heading)).toEqual(expected);
  });

  it('ignores headings that are not dates', () => {
    expect(parseDayHeading('FUTEBOL')).toBeNull();
  });
});
