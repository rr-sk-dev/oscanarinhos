import { MembershipRole } from './membership.entity';

export interface InviteEntity {
  id: string;
  teamId: string;
  role: MembershipRole;
  code: string;
  playerId: string | null;
  staffId: string | null;
  maxUses: number;
  uses: number;
  expiresAt: Date;
  createdByMembershipId: string;
  createdAt: Date;
}

export interface CreateInviteData {
  teamId: string;
  role: MembershipRole;
  code: string;
  playerId: string | null;
  staffId: string | null;
  maxUses: number;
  expiresAt: Date;
  createdByMembershipId: string;
}

export interface CreateInviteInput {
  role: MembershipRole;
  playerId?: string | null;
  staffId?: string | null;
}
