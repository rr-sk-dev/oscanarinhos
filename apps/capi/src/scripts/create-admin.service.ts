import { Injectable } from '@nestjs/common';
import { MembershipRepository } from '../members/membership.repository';
import { MembershipEntity } from '../members/types/membership.entity';
import { TeamRepository } from '../teams/teams.repository';
import { UserRepository } from '../users/user.repository';

export function slugify(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

@Injectable()
export class CreateAdminService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly membershipRepository: MembershipRepository,
    private readonly teamRepository: TeamRepository,
  ) {}

  /** Teams have no slug column: the slug is the slugified team name, e.g. "os-canarinhos". */
  async execute(rawEmail: string, teamSlug: string): Promise<MembershipEntity> {
    const email = rawEmail.trim().toLowerCase();
    const teams = await this.teamRepository.findAll();
    const team = teams.find((candidate) => slugify(candidate.name) === slugify(teamSlug));
    if (!team) {
      const known = teams.map((candidate) => slugify(candidate.name)).join(', ');
      throw new Error(`Unknown team slug "${teamSlug}". Known teams: ${known}`);
    }

    const user =
      (await this.userRepository.findByEmail(email)) ??
      (await this.userRepository.create({ email }));

    const existing = await this.membershipRepository.findByUserAndTeam(user.id, team.id);
    if (existing) {
      return existing.role === 'ADMIN'
        ? existing
        : this.membershipRepository.update(existing.id, { role: 'ADMIN' });
    }

    return this.membershipRepository.create({ userId: user.id, teamId: team.id, role: 'ADMIN' });
  }
}
