import {
    LeadershipRole as PrismaLeadershipRole,
    Player as PrismaPlayer,
    PlayerFoot as PrismaPlayerFoot,
    PlayerPosition as PrismaPlayerPosition,
    PlayerStatus as PrismaPlayerStatus,
} from '../../../prisma/generated/prisma/client';
import {
    LeadershipRole,
    PlayerEntity,
    PlayerFoot,
    PlayerPosition,
    PlayerStatus,
} from './player.entity';

export class PlayerMapper {
  static toDomain(record: PrismaPlayer): PlayerEntity {
    return {
      id: record.id,
      firstName: record.firstName,
      lastName: record.lastName,
      fullName: record.fullName,
      nickname: record.nickname,
      shirtNumber: record.shirtNumber,
      position: record.position as PlayerPosition,
      preferredFoot: record.preferredFoot as PlayerFoot,
      dateOfBirth: record.dateOfBirth,
      photo: record.photo,
      bio: record.bio,
      status: record.status as PlayerStatus,
      leadershipRole: record.leadershipRole as LeadershipRole,
      teamId: record.teamId,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  static toPositionPrisma(position: PlayerPosition): PrismaPlayerPosition {
    return position as PrismaPlayerPosition;
  }

  static toStatusPrisma(status: PlayerStatus): PrismaPlayerStatus {
    return status as PrismaPlayerStatus;
  }

  static toFootPrisma(foot: PlayerFoot): PrismaPlayerFoot {
    return foot as PrismaPlayerFoot;
  }

  static toLeadershipRolePrisma(role: LeadershipRole): PrismaLeadershipRole {
    return role as PrismaLeadershipRole;
  }
}
