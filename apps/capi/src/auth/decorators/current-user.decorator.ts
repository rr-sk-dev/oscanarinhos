import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TeamRequest } from '../guards/team-member.guard';
import { AuthenticatedUser } from '../types/authenticated-user';

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser =>
    context.switchToHttp().getRequest<TeamRequest>().user as AuthenticatedUser,
);
