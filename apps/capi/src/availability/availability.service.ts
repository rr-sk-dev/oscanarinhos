import { Injectable } from '@nestjs/common';
import { EventRepository } from '../events/event.repository';
import { EventNotFoundException } from '../events/exceptions/event.exceptions';
import { EventEntity } from '../events/types/event.entity';
import { MembershipRepository } from '../members/membership.repository';
import { MembershipEntity } from '../members/types/membership.entity';
import { AvailabilityRepository } from './availability.repository';
import { EventClosedForbiddenException } from './exceptions/availability.exceptions';
import {
  AvailabilityAnswer,
  AvailabilityEntity,
  AvailabilitySummary,
  MemberResponse,
} from './types/availability.entity';

export interface RespondInput {
  answer: AvailabilityAnswer;
  note?: string;
}

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly events: EventRepository,
    private readonly memberships: MembershipRepository,
    private readonly availabilities: AvailabilityRepository,
  ) {}

  async respond(
    teamId: string,
    eventId: string,
    membership: MembershipEntity,
    input: RespondInput,
    now: Date,
  ): Promise<AvailabilityEntity> {
    const event = await this.findEvent(teamId, eventId);
    if (this.isClosed(event, now)) {
      throw new EventClosedForbiddenException();
    }
    return this.availabilities.upsert({
      eventId,
      membershipId: membership.id,
      answer: input.answer,
      note: input.note?.trim() || null,
    });
  }

  async summary(teamId: string, eventId: string): Promise<AvailabilitySummary> {
    await this.findEvent(teamId, eventId);
    const [members, answers] = await Promise.all([
      this.memberships.findByTeam(teamId),
      this.availabilities.findByEvent(eventId),
    ]);
    const answerByMembership = new Map(answers.map((entry) => [entry.membershipId, entry]));
    const summary: AvailabilitySummary = { yes: [], maybe: [], no: [], noAnswer: [] };

    for (const member of members) {
      const answered = answerByMembership.get(member.id);
      const response: MemberResponse = {
        membershipId: member.id,
        displayName: member.displayName,
        role: member.role,
        note: answered?.note ?? null,
      };
      if (!answered) {
        summary.noAnswer.push(response);
        continue;
      }
      summary[BUCKET_BY_ANSWER[answered.answer]].push(response);
    }
    return summary;
  }

  private async findEvent(teamId: string, eventId: string): Promise<EventEntity> {
    const event = await this.events.findByIdInTeam(teamId, eventId);
    if (!event) {
      throw new EventNotFoundException();
    }
    return event;
  }

  private isClosed(event: EventEntity, now: Date): boolean {
    if (event.status === 'CANCELED') {
      return true;
    }
    if (event.startsAt <= now) {
      return true;
    }
    return event.respondBy !== null && event.respondBy <= now;
  }
}

const BUCKET_BY_ANSWER = { YES: 'yes', MAYBE: 'maybe', NO: 'no' } as const;
