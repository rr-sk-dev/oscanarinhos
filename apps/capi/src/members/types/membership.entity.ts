export const MEMBERSHIP_ROLES = ['ADMIN', 'COACH', 'PLAYER', 'STAFF'] as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLES)[number];

export interface MembershipEntity {
  id: string;
  userId: string;
  teamId: string;
  role: MembershipRole;
  playerId: string | null;
  staffId: string | null;
  displayName: string;
}

export interface MembershipWithTeam extends MembershipEntity {
  teamName: string;
}

export interface CreateMembershipData {
  userId: string;
  teamId: string;
  role: MembershipRole;
  playerId?: string | null;
  staffId?: string | null;
}

export interface UpdateMembershipData {
  role?: MembershipRole;
  playerId?: string | null;
  staffId?: string | null;
}
