import {
  TeamStaff as PrismaTeamStaff,
  StaffRole as PrismaStaffRole,
} from '../../../../prisma/generated/prisma/client';
import {
  StaffRole,
  TeamStaffEntity,
} from './team-staff.entity';

export class TeamStaffMapper {
  static toDomain(record: PrismaTeamStaff): TeamStaffEntity {
    return {
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      role: record.role as StaffRole,
      dateOfBirth: record.dateOfBirth,
      photo: record.photo,
      bio: record.bio,
      teamId: record.teamId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toRolePrisma(role: StaffRole): PrismaStaffRole {
    return role as PrismaStaffRole;
  }
}
