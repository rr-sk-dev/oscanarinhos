import { AgePipe } from './age.pipe';
import { BirthDatePipe } from './birth-date.pipe';
import { DateFormatPipe } from './date-formatting.pipe';
import { KickoffDatePipe } from './kickoff-date.pipe';
import { KickoffTimePipe } from './kickoff-time.pipe';
import { MatchInfoPipe } from './match-info.pipe';
import { aMatch } from '../shared/testing/match.fixture';
import { APP_CONSTANTS } from '../shared/app.constants';

describe('date pipes', () => {
  it('formatDate formats a long date and ignores missing or invalid values', () => {
    const pipe = new DateFormatPipe();
    expect(pipe.transform('2026-05-12T12:00:00.000Z')).toBe('12 de maio de 2026');
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform('not a date')).toBe('');
  });

  it('kickoffDate shows "Data a definir" when there is no valid kickoff', () => {
    const pipe = new KickoffDatePipe();
    expect(pipe.transform('2026-09-19T17:50:00.000Z')).toContain('19 de setembro');
    expect(pipe.transform('')).toBe('Data a definir');
    expect(pipe.transform('not a date')).toBe('Data a definir');
  });

  it('kickoffTime is empty when there is no valid kickoff', () => {
    const pipe = new KickoffTimePipe();
    expect(pipe.transform('2026-09-19T17:50:00.000Z')).toMatch(/^\d{2}:\d{2}$/);
    expect(pipe.transform(null)).toBe('');
  });

  it('birthDate reads the stored UTC date so it never shifts by a day', () => {
    const pipe = new BirthDatePipe();
    expect(pipe.transform('1990-05-12T00:00:00.000Z')).toBe('12/05/1990');
    expect(pipe.transform(null)).toBe('—');
  });

  it('age counts whole years and waits for the birthday', () => {
    const pipe = new AgePipe();
    const birthDate = '1990-05-12T00:00:00.000Z';
    expect(pipe.transform(birthDate, new Date(2026, 4, 11))).toBe(35);
    expect(pipe.transform(birthDate, new Date(2026, 4, 12))).toBe(36);
    expect(pipe.transform(null)).toBeNull();
  });
});

describe('MatchInfoPipe', () => {
  it('names the competition, season and round', () => {
    const pipe = new MatchInfoPipe();
    const season = APP_CONSTANTS.season.label;
    expect(pipe.transform(aMatch({ journey: 3 }))).toBe(`Torneio CIF ${season} • Jornada 3`);
    expect(pipe.transform(aMatch({ journey: 0 }))).toBe(`Torneio CIF ${season}`);
  });
});
