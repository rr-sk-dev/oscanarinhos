import { Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MatchRepository } from '../../matches/matches.repository';
import { MatchEntity, MatchStatus } from '../../matches/types/match.entity';
import { TeamEntity } from '../../teams/types/team.entity';
import { CIF_RESULTS_URL } from '../cif.constants';
import { ResultsScrapperService } from './results-scrapper.service';

const page = (journey: number): string =>
  readFileSync(
    join(__dirname, '..', 'parsers', '__fixtures__', `results-journey-${journey}.html`),
    'utf8',
  );

const team = (name: string): TeamEntity => ({
  id: `${name}-id`,
  name,
  shortName: null,
  logo: 'logo.png',
  teamPhoto: null,
  webContent: null,
  createdAt: new Date(),
  updatedAt: new Date(),
});

const match = (
  id: string,
  journey: number,
  home: string,
  away: string,
  status: MatchStatus = MatchStatus.Scheduled,
): MatchEntity => ({
  id,
  journey,
  kickoffAt: new Date('2026-09-19T15:00:00Z'),
  label: 'Torneio CIF 2026/27',
  status,
  homeTeamId: `${home}-id`,
  awayTeamId: `${away}-id`,
  homeScore: null,
  awayScore: null,
  location: null,
  videoId: null,
  events: null,
  lineups: null,
  homeTeam: team(home),
  awayTeam: team(away),
  createdAt: new Date(),
  updatedAt: new Date(),
});

describe('ResultsScrapperService', () => {
  const now = new Date('2026-10-06T12:00:00Z');
  let service: ResultsScrapperService;
  let matchRepository: jest.Mocked<MatchRepository>;
  let matches: MatchEntity[];
  let pages: Record<number, string>;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    matches = [];
    pages = {};

    matchRepository = {
      findAll: jest.fn(({ status } = {}) =>
        Promise.resolve(matches.filter((m) => m.status === status)),
      ),
      findAllWithTeams: jest.fn(({ journey } = {}) =>
        Promise.resolve(matches.filter((m) => m.journey === journey)),
      ),
      update: jest.fn(),
    } as unknown as jest.Mocked<MatchRepository>;

    jest.spyOn(global, 'fetch').mockImplementation((input) => {
      const journey = Number(String(input).replace(`${CIF_RESULTS_URL}/`, ''));
      const html = pages[journey];
      return Promise.resolve(new Response(html ?? '', { status: html ? 200 : 404 }));
    });

    service = new ResultsScrapperService(matchRepository);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('marks a match without result as postponed and keeps checking later journeys', async () => {
    matches = [
      match('j1', 1, 'Madeirinha', 'Canarinhos'),
      match('j3', 3, 'Laranjada', 'Vips'),
      match('j4', 4, 'Canarinhos', 'Vips'),
    ];
    pages = { 1: page(1), 3: page(1), 4: page(4) };

    await service.scrape(now);

    expect(matchRepository.update).toHaveBeenCalledWith('j1', { status: MatchStatus.Postponed });
    expect(matchRepository.update).toHaveBeenCalledWith('j3', {
      homeScore: 1,
      awayScore: 4,
      status: MatchStatus.Finished,
    });
    expect(matchRepository.update).not.toHaveBeenCalledWith('j4', expect.anything());
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it('stops at the first journey with no results at all', async () => {
    matches = [match('j4', 4, 'Canarinhos', 'Vips'), match('j5', 5, 'Canarinhos', 'Leões')];
    pages = { 4: page(4), 5: page(1) };

    await service.scrape(now);

    expect(matchRepository.update).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('records the result of a postponed match once the website shows it', async () => {
    matches = [match('j1', 1, 'Pé Leve', 'SD76', MatchStatus.Postponed)];
    pages = { 1: page(1) };

    await service.scrape(now);

    expect(matchRepository.update).toHaveBeenCalledWith('j1', {
      homeScore: 4,
      awayScore: 2,
      status: MatchStatus.Finished,
    });
  });

  it('leaves a match without result alone while its kickoff is still ahead', async () => {
    matches = [match('j1', 1, 'Madeirinha', 'Canarinhos')];
    pages = { 1: page(1) };

    await service.scrape(new Date('2026-09-19T12:00:00Z'));

    expect(matchRepository.update).not.toHaveBeenCalled();
  });

  it('matches team names regardless of case, accents and spacing', async () => {
    matches = [match('j1', 1, 'Pe Leve', 'SD 76')];
    pages = { 1: page(1) };

    await service.scrape(now);

    expect(matchRepository.update).toHaveBeenCalledWith('j1', {
      homeScore: 4,
      awayScore: 2,
      status: MatchStatus.Finished,
    });
  });

  it('stops when the website cannot be reached', async () => {
    matches = [match('j1', 1, 'Madeirinha', 'Canarinhos'), match('j3', 3, 'Laranjada', 'Vips')];

    await service.scrape(now);

    expect(matchRepository.update).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
