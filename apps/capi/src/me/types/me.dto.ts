import { MembershipRole } from '../../members/types/membership.entity';

export class MeResponseDto {
  user: { id: string; email: string; name: string | null };
  memberships: { teamId: string; teamName: string; role: MembershipRole; membershipId: string }[];
}
