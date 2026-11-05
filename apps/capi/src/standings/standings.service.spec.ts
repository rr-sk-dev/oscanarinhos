import { StandingNotFoundException } from './exceptions/standing.exceptions';
import { StandingsRepository } from './standings.repository';
import { StandingsService } from './standings.service';
import { StandingEntity } from './types/standing.entity';

describe('StandingsService', () => {
  let service: StandingsService;
  let standingsRepository: jest.Mocked<Pick<StandingsRepository, 'findBySeason'>>;

  const aStanding = (position: number, teamName: string): StandingEntity => ({
    id: `standing-${position}`,
    season: '2026-27',
    position,
    teamName,
    teamLogo: null,
    gamesPlayed: 6,
    wins: 3,
    draws: 1,
    losses: 2,
    goalsFor: 10,
    goalsAgainst: 7,
    goalDifference: 3,
    points: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const table = [aStanding(1, 'Leões'), aStanding(2, 'Canarinhos'), aStanding(3, 'Tigres')];

  beforeEach(() => {
    standingsRepository = { findBySeason: jest.fn().mockResolvedValue(table) };
    service = new StandingsService(standingsRepository as unknown as StandingsRepository);
  });

  describe('findBySeason', () => {
    it('returns every row of the season in table order', async () => {
      const result = await service.findBySeason('2026-27');

      expect(standingsRepository.findBySeason).toHaveBeenCalledWith('2026-27');
      expect(result.map((row) => row.teamName)).toEqual(['Leões', 'Canarinhos', 'Tigres']);
    });

    it('returns an empty table for a season without standings', async () => {
      standingsRepository.findBySeason.mockResolvedValue([]);

      await expect(service.findBySeason('2030-31')).resolves.toEqual([]);
    });
  });

  describe('findContext', () => {
    it('returns the team with its neighbours, ignoring case', async () => {
      const result = await service.findContext('canarinhos', '2026-27');

      expect(result.team.teamName).toBe('Canarinhos');
      expect(result.above?.teamName).toBe('Leões');
      expect(result.below?.teamName).toBe('Tigres');
    });

    it('throws when the team is not in the table', async () => {
      await expect(service.findContext('Cosmos', '2026-27')).rejects.toBeInstanceOf(
        StandingNotFoundException,
      );
    });
  });
});
