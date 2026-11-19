import {
  CreateMembershipData,
  MembershipEntity,
  UpdateMembershipData,
} from './types/membership.entity';

export abstract class MembershipRepository {
  abstract findByUserAndTeam(userId: string, teamId: string): Promise<MembershipEntity | null>;
  abstract findByTeam(teamId: string): Promise<MembershipEntity[]>;
  abstract countAdmins(teamId: string): Promise<number>;
  abstract create(data: CreateMembershipData): Promise<MembershipEntity>;
  abstract update(id: string, data: UpdateMembershipData): Promise<MembershipEntity>;
  abstract delete(id: string): Promise<void>;
}
