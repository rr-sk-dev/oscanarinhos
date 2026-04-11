import { enumOf, ValueOf } from '../../../utils/ts-utils';

export const StaffRole = enumOf({
  Coach: 'COACH',
  AssistantCoach: 'ASSISTANT_COACH',
  Delegate: 'DELEGATE',
  PhysicalPreparator: 'PHYSICAL_PREPARATOR',
});
export type StaffRole = ValueOf<typeof StaffRole>;

export class TeamStaffEntity {
  id: string;
  firstName: string;
  lastName: string;
  role: StaffRole;
  dateOfBirth: Date | null;
  photo: string | null;
  bio: string | null;
  teamId: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateTeamStaffData = Omit<
  TeamStaffEntity,
  'id' | 'createdAt' | 'updatedAt'
>;

export type UpdateTeamStaffData = Partial<
  Omit<TeamStaffEntity, 'id' | 'createdAt' | 'updatedAt'>
>;
