import { MatchesService } from './matches.service';
import { MatchRepository } from './matches.repository';
import { TeamRepository } from '../teams/teams.repository';
import { MatchNotFoundException } from './exceptions/match.exceptions';
import { TeamNotFoundException } from '../teams/exceptions/team.exceptions';

describe('MatchesService', () => {
  let service: MatchesService;
  let matchRepository: jest.Mocked<MatchRepository>;
  let teamRepository: jest.Mocked<TeamRepository>;

  const mockTeam = {
    id: 'team-uuid',
    name: 'Canarinhos',
    shortName: 'CAN',
    logo: 'logo.png',
    teamPhoto: null,
    webContent: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockMatch = {
    id: 'match-uuid',
    journey: 1,
    kickoffAt: new Date('2024-06-15T15:00:00Z'),
    label: 'Jornada 1',
    status: 'SCHEDULED' as const,
    homeTeamId: 'team-uuid',
    awayTeamId: 'away-uuid',
    homeScore: null,
    awayScore: null,
    location: 'Estádio Municipal',
    videoId: null,
    events: null,
    lineups: null,
    homeTeam: { ...mockTeam },
    awayTeam: { ...mockTeam, id: 'away-uuid', name: 'Rival FC' },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    matchRepository = {
      create: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      findAllWithTeams: jest.fn(),
      findByIdWithTeams: jest.fn(),
      findNextByTeam: jest.fn(),
      findUpcomingByTeam: jest.fn(),
      findFinishedByTeam: jest.fn(),
      findAllByTeam: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    } as any;

    teamRepository = {
      findById: jest.fn(),
      findByName: jest.fn(),
    } as any;

    service = new MatchesService(matchRepository, teamRepository);
  });

  describe('findByIdPublic', () => {
    it('should return match with nested teams', async () => {
      matchRepository.findByIdWithTeams.mockResolvedValue(mockMatch);

      const result = await service.findByIdPublic('match-uuid');

      expect(result.id).toBe('match-uuid');
      expect(result.homeTeam).toBeDefined();
    });

    it('should throw MatchNotFoundException when not found', async () => {
      matchRepository.findByIdWithTeams.mockResolvedValue(null);

      await expect(service.findByIdPublic('nonexistent')).rejects.toThrow(
        MatchNotFoundException,
      );
    });
  });

  describe('findNextByTeam', () => {
    it('should return next match when found', async () => {
      teamRepository.findByName.mockResolvedValue(mockTeam);
      matchRepository.findNextByTeam.mockResolvedValue(mockMatch);

      const result = await service.findNextByTeam('Canarinhos');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('match-uuid');
      expect(teamRepository.findByName).toHaveBeenCalledWith('Canarinhos');
      expect(matchRepository.findNextByTeam).toHaveBeenCalledWith('team-uuid');
    });

    it('should return null when no upcoming match', async () => {
      teamRepository.findByName.mockResolvedValue(mockTeam);
      matchRepository.findNextByTeam.mockResolvedValue(null);

      const result = await service.findNextByTeam('Canarinhos');

      expect(result).toBeNull();
    });

    it('should throw TeamNotFoundException when team does not exist', async () => {
      teamRepository.findByName.mockResolvedValue(null);

      await expect(service.findNextByTeam('Unknown')).rejects.toThrow(
        TeamNotFoundException,
      );
    });
  });

  describe('findUpcomingByTeam', () => {
    it('should return upcoming matches', async () => {
      teamRepository.findByName.mockResolvedValue(mockTeam);
      matchRepository.findUpcomingByTeam.mockResolvedValue([mockMatch]);

      const result = await service.findUpcomingByTeam('Canarinhos');

      expect(result).toHaveLength(1);
    });

    it('should throw TeamNotFoundException when team does not exist', async () => {
      teamRepository.findByName.mockResolvedValue(null);

      await expect(service.findUpcomingByTeam('Unknown')).rejects.toThrow(
        TeamNotFoundException,
      );
    });
  });

  describe('findAllByTeam', () => {
    it('should return all matches for a team', async () => {
      teamRepository.findByName.mockResolvedValue(mockTeam);
      matchRepository.findAllByTeam.mockResolvedValue([mockMatch]);

      const result = await service.findAllByTeam('Canarinhos');

      expect(result).toHaveLength(1);
      expect(matchRepository.findAllByTeam).toHaveBeenCalledWith('team-uuid');
    });

    it('should throw TeamNotFoundException when team does not exist', async () => {
      teamRepository.findByName.mockResolvedValue(null);

      await expect(service.findAllByTeam('Unknown')).rejects.toThrow(
        TeamNotFoundException,
      );
    });
  });

  describe('findFinishedByTeam', () => {
    it('should return finished matches', async () => {
      teamRepository.findByName.mockResolvedValue(mockTeam);
      matchRepository.findFinishedByTeam.mockResolvedValue([mockMatch]);

      const result = await service.findFinishedByTeam('Canarinhos');

      expect(result).toHaveLength(1);
    });
  });
});
