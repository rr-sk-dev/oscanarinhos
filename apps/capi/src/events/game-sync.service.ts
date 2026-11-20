import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Clock } from '../availability/clock';
import { CURRENT_SEASON_KICKOFFS } from '../scrapper/cif.constants';
import { MatchRepository } from '../matches/matches.repository';
import { MatchEntity } from '../matches/types/match.entity';
import { emitEventChange } from './emit-event-change';
import { EventRepository } from './event.repository';
import { EventEntity, EventStatus, UpdateEventData } from './types/event.entity';

export interface GameSyncResult {
  created: number;
  updated: number;
}

type GameContent = Required<Pick<UpdateEventData, 'title' | 'startsAt' | 'location' | 'status'>>;

/**
 * Mirrors the team's matches of the current season as GAME events, so nothing is entered twice.
 * Existing events are only updated in place (same id), which keeps their availability and
 * attendance rows; `notes` belong to the team and are never written here.
 */
@Injectable()
export class GameSyncService {
  private readonly logger = new Logger(GameSyncService.name);

  constructor(
    private readonly matchRepository: MatchRepository,
    private readonly eventRepository: EventRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly clock: Clock,
  ) {}

  async syncTeam(teamId: string): Promise<GameSyncResult> {
    const matches = await this.findSeasonMatches(teamId);
    const existing = await this.eventRepository.findByMatchIds(
      teamId,
      matches.map((match) => match.id),
    );
    const eventByMatchId = new Map(existing.map((event) => [event.matchId, event]));

    const result: GameSyncResult = { created: 0, updated: 0 };
    for (const match of matches) {
      const outcome = await this.syncMatch(teamId, match, eventByMatchId.get(match.id));
      if (outcome) {
        result[outcome] += 1;
      }
    }

    return result;
  }

  private async findSeasonMatches(teamId: string): Promise<MatchEntity[]> {
    const { kickoffFrom, kickoffTo } = CURRENT_SEASON_KICKOFFS;
    const matches = await this.matchRepository.findAllByTeam(teamId);
    return matches.filter(
      (match) =>
        (match.homeTeamId === teamId || match.awayTeamId === teamId) &&
        match.kickoffAt >= kickoffFrom &&
        match.kickoffAt < kickoffTo,
    );
  }

  private async syncMatch(
    teamId: string,
    match: MatchEntity,
    event: EventEntity | undefined,
  ): Promise<keyof GameSyncResult | null> {
    const content = this.toGameContent(match);
    if (!event) {
      const created = await this.eventRepository.createIfAbsent({
        teamId,
        type: 'GAME',
        ...content,
        endsAt: null,
        notes: null,
        respondBy: null,
        matchId: match.id,
      });
      // null: a concurrent sync created it first, which is the outcome we wanted anyway.
      return created ? 'created' : null;
    }

    const changes = this.diff(event, content);
    if (Object.keys(changes).length === 0) {
      return null;
    }

    await this.eventRepository.update(teamId, event.id, changes);
    // Scraper-driven, so there is no actor to exclude from the notification.
    emitEventChange(
      this.eventEmitter,
      this.clock,
      this.logger,
      event,
      { ...event, ...changes },
      null,
    );
    return 'updated';
  }

  private toGameContent(match: MatchEntity): GameContent {
    // POSTPONED is also what the scraper sets for "kickoff passed, no result yet", so it must not cancel.
    const status: EventStatus = match.status === 'CANCELED' ? 'CANCELED' : 'SCHEDULED';
    return {
      title: `${match.homeTeam?.name ?? '?'} vs ${match.awayTeam?.name ?? '?'}`,
      startsAt: match.kickoffAt,
      location: match.location,
      status,
    };
  }

  private diff(event: EventEntity, content: GameContent): UpdateEventData {
    const changes: UpdateEventData = {};
    if (event.title !== content.title) {
      changes.title = content.title;
    }

    if (event.startsAt.getTime() !== content.startsAt.getTime()) {
      changes.startsAt = content.startsAt;
    }

    if (event.location !== content.location) {
      changes.location = content.location;
    }

    if (event.status !== content.status) {
      changes.status = content.status;
    }

    return changes;
  }
}
