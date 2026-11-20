import { Injectable } from '@nestjs/common';
import { AvailabilityRepository } from '../availability/availability.repository';
import { MembershipRepository } from '../members/membership.repository';
import { UserRepository } from '../users/user.repository';

export interface NotificationRecipient {
  userId: string;
  email: string;
}

@Injectable()
export class RecipientResolver {
  constructor(
    private readonly memberships: MembershipRepository,
    private readonly availability: AvailabilityRepository,
    private readonly users: UserRepository,
  ) {}

  async resolve(
    teamId: string,
    eventId: string,
    actorUserId: string | null,
  ): Promise<NotificationRecipient[]> {
    const [teamMemberships, answers] = await Promise.all([
      this.memberships.findByTeam(teamId),
      this.availability.findByEvent(eventId),
    ]);

    const declinedMembershipIds = new Set(
      answers.filter((entry) => entry.answer === 'NO').map((entry) => entry.membershipId),
    );
    const userIds = new Set(
      teamMemberships
        .filter((membership) => !declinedMembershipIds.has(membership.id))
        .map((membership) => membership.userId)
        .filter((userId) => userId !== actorUserId),
    );

    const found = await Promise.all([...userIds].map((userId) => this.users.findById(userId)));

    return found.flatMap((user) => (user ? [{ userId: user.id, email: user.email }] : []));
  }
}
