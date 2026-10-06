import { Logger } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { MatchRepository } from '../../matches/matches.repository';
import { MatchEntity, MatchStatus } from '../../matches/types/match.entity';
import { TeamRepository } from '../../teams/teams.repository';
import { TeamEntity } from '../../teams/types/team.entity';
import { ResultsPageClient } from '../clients/results-page.client';
import { parseResultsPage, ScrapedMatch } from '../parsers/results.parser';
import { FixturesScrapperService } from './fixtures-scrapper.service';

const page = (journey: number): ScrapedMatch[] =>
  parseResultsPage(
    readFileSync(
      join(__dirname, '..', 'parsers', '__fixtures__', `results-journey-${journey}.html`),
      'utf8',
    ),
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
  journey: number,
  home: TeamEntity,
  away: TeamEntity,
  kickoffAt: Date,
  status: MatchStatus = MatchStatus.Scheduled,
): MatchEntity => ({
  id: `match-${journey}`,
  journey,
  kickoffAt,
  label: 'Torneio CIF 2026/27',
  status,
  homeTeamId: home.id,
  awayTeamId: away.id,
  homeScore: null,
  awayScore: null,
  location: null,
  videoId: null,
  events: null,
  lineups: null,
  homeTeam: home,
  awayTeam: away,
  createdAt: new Date(),
  updatedAt: new Date(),
});

// Journey 1: Madeirinha vs Canarinhos, Saturday 19 September 2026 18:50 Lisbon.
const JOURNEY_1_KICKOFF = new Date('2026-09-19T17:50:00Z');
// Journey 4 page, served as journey 2: Canarinhos vs Vips, Saturday 10 October 2026 12:10.
const JOURNEY_2_KICKOFF = new Date('2026-10-10T11:10:00Z');

describe('FixturesScrapperService', () => {
  const now = new Date('2026-10-06T12:00:00Z');
  const canarinhos = team('Canarinhos');
  const madeirinha = team('Madeirinha');
  const vips = team('VIPs');

  let service: FixturesScrapperService;
  let matchRepository: jest.Mocked<MatchRepository>;
  let teamRepository: jest.Mocked<TeamRepository>;
  let resultsPageClient: jest.Mocked<ResultsPageClient>;
  let teams: TeamEntity[];
  let matches: MatchEntity[];
  let pages: Record<number, ScrapedMatch[] | null>;

  beforeEach(() => {
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();

    teams = [canarinhos, madeirinha, vips];
    matches = [];
    pages = { 1: page(1), 2: page(4) };

    matchRepository = {
      findAllWithTeams: jest.fn(({ journey } = {}) =>
        Promise.resolve(matches.filter((m) => m.journey === journey)),
      ),
      create: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<MatchRepository>;

    teamRepository = {
      findAll: jest.fn(() => Promise.resolve([...teams])),
      create: jest.fn((data) => Promise.resolve({ ...team(data.name), ...data })),
    } as unknown as jest.Mocked<TeamRepository>;

    resultsPageClient = {
      fetchJourney: jest.fn((journey: number) => Promise.resolve(pages[journey] ?? [])),
    } as unknown as jest.Mocked<ResultsPageClient>;

    service = new FixturesScrapperService(matchRepository, teamRepository, resultsPageClient);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates our missing matches until the calendar ends', async () => {
    await service.scrape(now);

    expect(matchRepository.create).toHaveBeenCalledTimes(2);
    expect(matchRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        journey: 1,
        kickoffAt: JOURNEY_1_KICKOFF,
        status: MatchStatus.Scheduled,
        homeTeamId: madeirinha.id,
        awayTeamId: canarinhos.id,
        label: 'Torneio CIF 2026/27',
      }),
    );
    expect(matchRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        journey: 2,
        kickoffAt: JOURNEY_2_KICKOFF,
        homeTeamId: canarinhos.id,
        awayTeamId: vips.id,
      }),
    );
    expect(resultsPageClient.fetchJourney).toHaveBeenCalledTimes(3);
    expect(teamRepository.create).not.toHaveBeenCalled();
  });

  it('creates a team it has not seen before, with its CIF logo', async () => {
    teams = [canarinhos, vips];

    await service.scrape(now);

    expect(teamRepository.create).toHaveBeenCalledTimes(1);
    expect(teamRepository.create).toHaveBeenCalledWith({
      name: 'Madeirinha',
      shortName: null,
      logo: 'https://www.cif.org.pt/Assets/img/decor/logos/256/madeirinha.png',
      teamPhoto: null,
      webContent: null,
    });
  });

  it('moves the kickoff and opponent of a match not played yet', async () => {
    matches = [match(2, canarinhos, madeirinha, new Date('2026-10-11T14:00:00Z'))];

    await service.scrape(now);

    expect(matchRepository.update).toHaveBeenCalledWith('match-2', {
      awayTeamId: vips.id,
      kickoffAt: JOURNEY_2_KICKOFF,
    });
  });

  it('leaves an up-to-date match alone', async () => {
    matches = [match(2, canarinhos, vips, JOURNEY_2_KICKOFF)];

    await service.scrape(now);

    expect(matchRepository.update).not.toHaveBeenCalled();
    expect(matchRepository.create).toHaveBeenCalledTimes(1);
  });

  it('never touches a finished match', async () => {
    matches = [match(1, madeirinha, canarinhos, new Date('2026-09-01T10:00:00Z'), 'FINISHED')];

    await service.scrape(now);

    expect(matchRepository.update).not.toHaveBeenCalledWith('match-1', expect.anything());
  });

  it('schedules a postponed match again once it has a new date ahead', async () => {
    matches = [match(2, canarinhos, vips, new Date('2026-10-03T11:10:00Z'), 'POSTPONED')];

    await service.scrape(now);

    expect(matchRepository.update).toHaveBeenCalledWith('match-2', {
      kickoffAt: JOURNEY_2_KICKOFF,
      status: MatchStatus.Scheduled,
    });
  });

  it('stops when the website cannot be reached', async () => {
    pages = { 1: null };

    await service.scrape(now);

    expect(resultsPageClient.fetchJourney).toHaveBeenCalledTimes(1);
    expect(matchRepository.create).not.toHaveBeenCalled();
  });
});
