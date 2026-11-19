import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MembershipRole } from '../../members/types/membership.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { RoleForbiddenException } from '../exceptions/auth.exceptions';
import { TeamRequest } from './team-member.guard';

/** Must run after TeamMemberGuard. Routes without @Roles() accept any member. */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const allowedRoles = this.reflector.getAllAndOverride<MembershipRole[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const membership = context.switchToHttp().getRequest<TeamRequest>().membership;
    if (!membership || !allowedRoles.includes(membership.role)) {
      throw new RoleForbiddenException();
    }

    return true;
  }
}
