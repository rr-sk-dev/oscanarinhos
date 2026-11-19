import { Role } from './member';

export type AvailabilityAnswer = 'YES' | 'NO' | 'MAYBE';

export interface MemberResponse {
  membershipId: string;
  displayName: string;
  role: Role;
  note: string | null;
}

export interface AvailabilitySummary {
  yes: MemberResponse[];
  maybe: MemberResponse[];
  no: MemberResponse[];
  noAnswer: MemberResponse[];
}

export interface AvailabilityCounts {
  yes: number;
  maybe: number;
  no: number;
  noAnswer: number;
}
