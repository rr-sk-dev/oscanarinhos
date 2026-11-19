import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { DatabaseModule } from '../database';
import { PlayersModule } from '../players/players.module';
import { TeamsModule } from '../teams/teams.module';
import { PrismaInviteRepository } from './invite-prisma.repository';
import { InviteRepository } from './invite.repository';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';
import { PrismaMembershipRepository } from './membership-prisma.repository';
import { MembershipRepository } from './membership.repository';

// The guards are provided here rather than imported through AuthModule, which already
// imports this module (they only need MembershipRepository and Reflector).
@Module({
  imports: [
    DatabaseModule.forFeature('membership'),
    DatabaseModule.forFeature('invite'),
    PlayersModule,
    TeamsModule,
  ],
  controllers: [MembersController],
  providers: [
    MembersService,
    JwtAuthGuard,
    TeamMemberGuard,
    RolesGuard,
    { provide: MembershipRepository, useClass: PrismaMembershipRepository },
    { provide: InviteRepository, useClass: PrismaInviteRepository },
  ],
  exports: [MembershipRepository, MembersService],
})
export class MembersModule {}
