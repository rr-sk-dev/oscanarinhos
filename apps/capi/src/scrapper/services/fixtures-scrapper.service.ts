import { Injectable, Logger } from '@nestjs/common';
import { MatchRepository } from '../../matches/matches.repository';
import { MatchEntity, MatchStatus, UpdateMatchData } from '../../matches/types/match.entity';
import { TeamRepository } from '../../teams/teams.repository';
import { TeamEntity } from '../../teams/types/team.entity';
import { COMPETITION_LABEL, CURRENT_SEASON_KICKOFFS, OUR_TEAM_NAME } from '../cif.constants';
import { ResultsPageClient } from '../clients/results-page.client';
import { ScrapedMatch } from '../parsers/results.parser';
import { isSameTeam } from '../team-name';

// A 18-team double round robin has 34 journeys; this only guards against an endless loop.
const MAX_JOURNEYS = 60;

type ScheduledFixture = ScrapedMatch & { kickoffAt: Date };

/**
 * Keeps our team's matches in step with the season calendar on cif.org.pt:
 * creates missing ones (and teams we haven't seen yet), and moves kickoffs and
 * opponents of matches not played yet. Scores are left to ResultsScrapperService.
 */
@Injectable()
export class FixturesScrapperService {
  private readonly logger = new Logger(FixturesScrapperService.name);

  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly teamRepository: TeamRepository,
    private readonly resultsPageClient: ResultsPageClient,
  ) {}

  async scrape(now: Date = new Date()): Promise<void> {
    const teams = await this.teamRepository.findAll();

    for (let journey = 1; journey <= MAX_JOURNEYS; journey++) {
      const scraped = await this.resultsPageClient.fetchJourney(journey);
      if (scraped === null) {
        return;
      }
      if (scraped.length === 0) {
        this.logger.log(`Calendar ends at journey ${journey - 1}`);
        return;
      }

      const ours = scraped.find((m) => this.involvesUs(m.homeTeamName, m.awayTeamName));
      if (!ours) {
        this.logger.warn(`Journey ${journey}: ${OUR_TEAM_NAME} not found on the website`);
        continue;
      }
      if (!ours.kickoffAt) {
        this.logger.warn(`Journey ${journey}: our match has no kickoff on the website`);
        continue;
      }

      await this.syncFixture(journey, { ...ours, kickoffAt: ours.kickoffAt }, teams, now);
    }
  }

  private async syncFixture(
    journey: number,
    fixture: ScheduledFixture,
    teams: TeamEntity[],
    now: Date,
  ): Promise<void> {
    const homeTeam = await this.findOrCreateTeam(fixture.homeTeamName, fixture.homeTeamLogo, teams);
    const awayTeam = await this.findOrCreateTeam(fixture.awayTeamName, fixture.awayTeamLogo, teams);
    const label = `${fixture.homeTeamName} vs ${fixture.awayTeamName}`;

    const existing = await this.findOurMatch(journey);
    if (!existing) {
      await this.matchRepository.create({
        journey,
        kickoffAt: fixture.kickoffAt,
        label: COMPETITION_LABEL,
        status: MatchStatus.Scheduled,
        homeTeamId: homeTeam.id,
        awayTeamId: awayTeam.id,
        homeScore: null,
        awayScore: null,
        location: null,
        videoId: null,
        events: null,
        lineups: null,
      });
      this.logger.log(`Journey ${journey}: created ${label}`);
      return;
    }

    if (existing.status === MatchStatus.Finished) {
      return;
    }

    const changes = this.diff(existing, fixture, homeTeam.id, awayTeam.id, now);
    if (Object.keys(changes).length === 0) {
      return;
    }

    await this.matchRepository.update(existing.id, changes);
    this.logger.log(`Journey ${journey}: updated ${label} (${Object.keys(changes).join(', ')})`);
  }

  private diff(
    match: MatchEntity,
    fixture: ScheduledFixture,
    homeTeamId: string,
    awayTeamId: string,
    now: Date,
  ): UpdateMatchData {
    const changes: UpdateMatchData = {};

    if (match.homeTeamId !== homeTeamId) {
      changes.homeTeamId = homeTeamId;
    }
    if (match.awayTeamId !== awayTeamId) {
      changes.awayTeamId = awayTeamId;
    }
    if (match.kickoffAt.getTime() !== fixture.kickoffAt.getTime()) {
      changes.kickoffAt = fixture.kickoffAt;

      // A postponed match that got a new date ahead of us is scheduled again.
      if (match.status === MatchStatus.Postponed && fixture.kickoffAt > now) {
        changes.status = MatchStatus.Scheduled;
      }
    }

    return changes;
  }

  private async findOurMatch(journey: number): Promise<MatchEntity | null> {
    const matches = await this.matchRepository.findAllWithTeams({
      journey,
      ...CURRENT_SEASON_KICKOFFS,
    });
    return (
      matches.find((m) => this.involvesUs(m.homeTeam?.name ?? '', m.awayTeam?.name ?? '')) ?? null
    );
  }

  private async findOrCreateTeam(
    name: string,
    logo: string | null,
    teams: TeamEntity[],
  ): Promise<TeamEntity> {
    const known = teams.find((t) => isSameTeam(t.name, name));
    if (known) {
      return known;
    }

    const created = await this.teamRepository.create({
      name,
      shortName: null,
      logo: logo ?? '',
      teamPhoto: null,
      webContent: null,
    });
    teams.push(created);
    this.logger.log(`Created new team ${name}`);
    return created;
  }

  private involvesUs(homeTeamName: string, awayTeamName: string): boolean {
    return isSameTeam(homeTeamName, OUR_TEAM_NAME) || isSameTeam(awayTeamName, OUR_TEAM_NAME);
  }
}
