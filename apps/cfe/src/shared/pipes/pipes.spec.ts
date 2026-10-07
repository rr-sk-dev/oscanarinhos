import { CurrencyPipe, DatePipe } from '@angular/common';
import { DEFAULT_CURRENCY_CODE, LOCALE_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { TeamResult } from '@canarinhos/shared-types';
import { APP_CONSTANTS } from '../app.constants';
import { aMatch } from '../testing/match.fixture';
import { KickoffDatePipe } from './kickoff-date.pipe';
import { MatchInfoPipe } from './match-info.pipe';
import { ResultBadgeClassPipe } from './result-badge-class.pipe';

describe('pt-PT locale', () => {
  it("formats Angular's date and currency pipes in Portuguese", () => {
    const locale = TestBed.inject(LOCALE_ID);
    const date = new DatePipe(locale);
    const currency = new CurrencyPipe(locale, TestBed.inject(DEFAULT_CURRENCY_CODE));

    expect(locale).toBe('pt-PT');

    expect(date.transform('2026-05-12T12:00:00.000Z', 'longDate')).toBe('12 de maio de 2026');
    expect(date.transform('1990-05-12T00:00:00.000Z', 'dd/MM/yyyy', 'UTC')).toBe('12/05/1990');
    expect(currency.transform(35, undefined, 'symbol', '1.0-0')).toBe('35\u00a0€'); // pt-PT puts a non-breaking space before the symbol
  });
});

describe('KickoffDatePipe', () => {
  const pipe = () => TestBed.runInInjectionContext(() => new KickoffDatePipe());

  it('shows the weekday, date and time', () => {
    const date = new Date(2026, 8, 19, 18, 50).toISOString();
    expect(pipe().transform(date)).toBe('sábado, 19 de setembro, 18:50');
  });

  it('shows "Data a definir" when there is no valid kickoff', () => {
    expect(pipe().transform('')).toBe('Data a definir');
    expect(pipe().transform('not a date')).toBe('Data a definir');
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

describe('ResultBadgeClassPipe', () => {
  it('colors each result', () => {
    const pipe = new ResultBadgeClassPipe();
    expect(pipe.transform(TeamResult.WIN)).toContain('text-cui-win');
    expect(pipe.transform(TeamResult.DRAW)).toContain('text-cui-draw');
    expect(pipe.transform(TeamResult.LOSS)).toContain('text-cui-loss');
  });
});
