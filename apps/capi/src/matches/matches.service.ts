import { Injectable } from '@nestjs/common';
import { TeamNotFoundException } from '../teams/exceptions/team.exceptions';
import { TeamRepository } from '../teams/teams.repository';
import { MatchNotFoundException } from './exceptions/match.exceptions';
import { MatchRepository } from './matches.repository';
import { MatchResponseDto } from './types/match.dto';

@Injectable()
export class MatchesService {
  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly teamRepository: TeamRepository,
  ) {}

  async findByIdPublic(id: string): Promise<MatchResponseDto> {
    const match = await this.matchRepository.findByIdWithTeams(id);

    if (!match) {
      throw new MatchNotFoundException();
    }

    return MatchResponseDto.fromEntity(match);
  }

  async findNextByTeam(teamName: string): Promise<MatchResponseDto | null> {
    const team = await this.teamRepository.findByName(teamName);

    if (!team) {
      throw new TeamNotFoundException();
    }

    const match = await this.matchRepository.findNextByTeam(team.id);
    return match ? MatchResponseDto.fromEntity(match) : null;
  }

  async findUpcomingByTeam(teamName: string): Promise<MatchResponseDto[]> {
    const team = await this.teamRepository.findByName(teamName);

    if (!team) {
      throw new TeamNotFoundException();
    }

    const matches = await this.matchRepository.findUpcomingByTeam(team.id);
    return matches.map(MatchResponseDto.fromEntity);
  }

  async findAllByTeam(teamName: string): Promise<MatchResponseDto[]> {
    const team = await this.teamRepository.findByName(teamName);

    if (!team) {
      throw new TeamNotFoundException();
    }

    const matches = await this.matchRepository.findAllByTeam(team.id);
    return matches.map(MatchResponseDto.fromEntity);
  }

  async findFinishedByTeam(teamName: string): Promise<MatchResponseDto[]> {
    const team = await this.teamRepository.findByName(teamName);

    if (!team) {
      throw new TeamNotFoundException();
    }

    const matches = await this.matchRepository.findFinishedByTeam(team.id);
    return matches.map(MatchResponseDto.fromEntity);
  }
}
