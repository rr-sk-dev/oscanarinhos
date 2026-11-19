import { GameSyncService } from '../events/game-sync.service';
import { TeamRepository } from '../teams/teams.repository';
import { OUR_TEAM_NAME } from './cif.constants';
import { ScrapperCronService } from './scrapper-cron.service';
import { FixturesScrapperService } from './services/fixtures-scrapper.service';
import { ResultsScrapperService } from './services/results-scrapper.service';
import { ScorersScrapperService } from './services/scorers-scrapper.service';
import { StandingsScrapperService } from './services/standings-scrapper.service';

describe('ScrapperCronService game sync', () => {
  let service: ScrapperCronService;
  let order: string[];
  let fixtures: jest.Mocked<FixturesScrapperService>;
  let results: jest.Mocked<ResultsScrapperService>;
  let standings: jest.Mocked<StandingsScrapperService>;
  let scorers: jest.Mocked<ScorersScrapperService>;
  let teams: jest.Mocked<TeamRepository>;
  let gameSync: jest.Mocked<GameSyncService>;

  beforeEach(() => {
    order = [];
    const step = (name: string) => jest.fn(async () => void order.push(name));
    fixtures = { scrape: step('fixtures') } as unknown as jest.Mocked<FixturesScrapperService>;
    results = { scrape: step('results') } as unknown as jest.Mocked<ResultsScrapperService>;
    standings = { scrape: step('standings') } as unknown as jest.Mocked<StandingsScrapperService>;
    scorers = { scrape: step('scorers') } as unknown as jest.Mocked<ScorersScrapperService>;
    teams = {
      findByName: jest.fn().mockResolvedValue({ id: 'team-1', name: OUR_TEAM_NAME }),
    } as unknown as jest.Mocked<TeamRepository>;
    gameSync = {
      syncTeam: jest.fn(async () => {
        order.push('sync');
        return { created: 0, updated: 0 };
      }),
    } as unknown as jest.Mocked<GameSyncService>;
    service = new ScrapperCronService(fixtures, results, standings, scorers, teams, gameSync);
  });

  it('syncs our team games after fixtures and results', async () => {
    await service.runWeeklyScrape();

    expect(teams.findByName).toHaveBeenCalledWith(OUR_TEAM_NAME);
    expect(gameSync.syncTeam).toHaveBeenCalledWith('team-1');
    expect(order.slice(0, 3)).toEqual(['fixtures', 'results', 'sync']);
  });

  it('skips silently when our team does not exist', async () => {
    teams.findByName.mockResolvedValue(null);

    await service.runWeeklyScrape();

    expect(gameSync.syncTeam).not.toHaveBeenCalled();
    expect(order).toEqual(['fixtures', 'results', 'standings', 'scorers']);
  });

  it('does not abort the scrape when the game sync fails', async () => {
    gameSync.syncTeam.mockRejectedValue(new Error('boom'));
    jest.spyOn(service['logger'], 'error').mockImplementation();

    await expect(service.runWeeklyScrape()).resolves.toBeUndefined();

    expect(order).toEqual(['fixtures', 'results', 'standings', 'scorers']);
  });

  it('does not abort the scrape when the team lookup fails', async () => {
    teams.findByName.mockRejectedValue(new Error('db down'));
    jest.spyOn(service['logger'], 'error').mockImplementation();

    await expect(service.runWeeklyScrape()).resolves.toBeUndefined();

    expect(order).toEqual(['fixtures', 'results', 'standings', 'scorers']);
  });
});
