import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { MembershipEntity } from '../../members/types/membership.entity';
import { TeamRequest } from '../guards/team-member.guard';

export const CurrentMembership = createParamDecorator(
  (_data: unknown, context: ExecutionContext): MembershipEntity | undefined =>
    context.switchToHttp().getRequest<TeamRequest>().membership,
);
