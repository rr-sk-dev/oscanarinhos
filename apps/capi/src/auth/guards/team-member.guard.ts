import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { isUUID } from 'class-validator';
import { Request } from 'express';
import { MembershipRepository } from '../../members/membership.repository';
import { MembershipEntity } from '../../members/types/membership.entity';
import { NotATeamMemberException } from '../exceptions/auth.exceptions';
import { AuthenticatedUser } from '../types/authenticated-user';

export type TeamRequest = Request & {
  user?: AuthenticatedUser;
  membership?: MembershipEntity;
};

/** Must run after JwtAuthGuard. Loads the caller's membership of `:teamId`. */
@Injectable()
export class TeamMemberGuard implements CanActivate {
  constructor(private readonly membershipRepository: MembershipRepository) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<TeamRequest>();
    const userId = request.user?.userId;
    const teamId = request.params?.teamId;

    if (!userId || typeof teamId !== 'string' || !isUUID(teamId)) {
      throw new NotATeamMemberException();
    }

    const membership = await this.membershipRepository.findByUserAndTeam(userId, teamId);
    if (!membership) {
      throw new NotATeamMemberException();
    }

    request.membership = membership;
    return true;
  }
}
