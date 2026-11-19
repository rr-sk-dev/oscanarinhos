import { SetMetadata } from '@nestjs/common';
import { MembershipRole } from '../../members/types/membership.entity';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: MembershipRole[]) => SetMetadata(ROLES_KEY, roles);
