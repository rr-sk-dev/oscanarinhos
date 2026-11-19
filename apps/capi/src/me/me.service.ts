import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../members/membership.repository';
import { UserNotFoundException } from '../users/exceptions/user.exceptions';
import { UserRepository } from '../users/user.repository';
import { MeResponseDto } from './types/me.dto';

@Injectable()
export class MeService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly membershipRepository: MembershipRepository,
  ) {}

  async getMe(userId: string): Promise<MeResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundException();
    }

    const memberships = await this.membershipRepository.findByUserWithTeam(userId);
    return {
      user: { id: user.id, email: user.email, name: user.name },
      memberships: memberships.map((membership) => ({
        teamId: membership.teamId,
        teamName: membership.teamName,
        role: membership.role,
        membershipId: membership.id,
      })),
    };
  }
}
