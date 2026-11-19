export type Role = 'ADMIN' | 'COACH' | 'PLAYER' | 'STAFF';

export interface Membership {
  teamId: string;
  teamName: string;
  role: Role;
  membershipId: string;
}

export interface MeResponse {
  user: { id: string; email: string; name: string | null };
  memberships: Membership[];
}

export interface Invite {
  id: string;
  code: string;
  role: Role;
  playerId: string | null;
  staffId: string | null;
  maxUses: number;
  expiresAt: string;
}
