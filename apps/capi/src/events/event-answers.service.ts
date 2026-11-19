import { Injectable } from '@nestjs/common';
import { AvailabilityRepository } from '../availability/availability.repository';
import { AvailabilityEntity } from '../availability/types/availability.entity';
import { MembershipRepository } from '../members/membership.repository';
import { MembershipEntity } from '../members/types/membership.entity';
import { EventEntity, EventWithAnswers } from './types/event.entity';

/** Adds the caller's answer and the per-answer counts to events, in one query for all events. */
@Injectable()
export class EventAnswersService {
  constructor(
    private readonly availabilities: AvailabilityRepository,
    private readonly memberships: MembershipRepository,
  ) {}

  async enrich(
    teamId: string,
    events: EventEntity[],
    viewer: MembershipEntity,
  ): Promise<EventWithAnswers[]> {
    if (events.length === 0) {
      return [];
    }
    const [members, answers] = await Promise.all([
      this.memberships.findByTeam(teamId),
      this.availabilities.findByEvents(events.map((event) => event.id)),
    ]);
    const memberIds = new Set(members.map((member) => member.id));
    const answersByEvent = new Map<string, AvailabilityEntity[]>();
    for (const answer of answers) {
      if (!memberIds.has(answer.membershipId)) {
        continue;
      }
      const forEvent = answersByEvent.get(answer.eventId) ?? [];
      forEvent.push(answer);
      answersByEvent.set(answer.eventId, forEvent);
    }

    return events.map((event) => {
      const forEvent = answersByEvent.get(event.id) ?? [];
      const yes = forEvent.filter((answer) => answer.answer === 'YES').length;
      const maybe = forEvent.filter((answer) => answer.answer === 'MAYBE').length;
      const no = forEvent.filter((answer) => answer.answer === 'NO').length;
      return {
        ...event,
        myAnswer: forEvent.find((answer) => answer.membershipId === viewer.id)?.answer ?? null,
        counts: { yes, maybe, no, noAnswer: Math.max(0, members.length - forEvent.length) },
      };
    });
  }

  async enrichOne(
    teamId: string,
    event: EventEntity,
    viewer: MembershipEntity,
  ): Promise<EventWithAnswers> {
    const [enriched] = await this.enrich(teamId, [event], viewer);
    return enriched;
  }
}
