import { IsIn, IsOptional, IsUUID } from 'class-validator';
import { MEMBERSHIP_ROLES, MembershipRole } from './membership.entity';

export class CreateInviteDto {
  @IsIn(MEMBERSHIP_ROLES)
  role: MembershipRole;

  @IsOptional()
  @IsUUID()
  playerId?: string;

  @IsOptional()
  @IsUUID()
  staffId?: string;
}

export class MemberResponseDto {
  id: string;
  userId: string;
  role: MembershipRole;
  playerId: string | null;
  staffId: string | null;
  displayName: string;
}

export class InviteResponseDto {
  id: string;
  code: string;
  role: MembershipRole;
  playerId: string | null;
  staffId: string | null;
  maxUses: number;
  expiresAt: string;
}
