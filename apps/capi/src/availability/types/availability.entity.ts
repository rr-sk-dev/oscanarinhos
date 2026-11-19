import { MembershipRole } from '../../members/types/membership.entity';
export const AVAILABILITY_ANSWERS = ['YES', 'NO', 'MAYBE'] as const;
export type AvailabilityAnswer = (typeof AVAILABILITY_ANSWERS)[number];

export interface AvailabilityEntity {
  id: string;
  eventId: string;
  membershipId: string;
  answer: AvailabilityAnswer;
  note: string | null;
}

export interface UpsertAvailabilityData {
  eventId: string;
  membershipId: string;
  answer: AvailabilityAnswer;
  note: string | null;
}

export interface MemberResponse {
  membershipId: string;
  displayName: string;
  role: MembershipRole;
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
