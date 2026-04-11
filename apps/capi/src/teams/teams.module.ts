import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database';
import { PrismaTeamStaffRepository } from './staff/team-staff-prisma.repository';
import { TeamStaffController } from './staff/team-staff.controller';
import { TeamStaffRepository } from './staff/team-staff.repository';
import { TeamStaffService } from './staff/team-staff.service';
import { PrismaTeamRepository } from './teams-prisma.repository';
import { TeamsController } from './teams.controller';
import { TeamRepository } from './teams.repository';
import { TeamsService } from './teams.service';

@Module({
  imports: [
    DatabaseModule.forFeature('team'),
    DatabaseModule.forFeature('teamStaff'),
  ],
  controllers: [TeamsController, TeamStaffController],
  providers: [
    {
      provide: TeamRepository,
      useClass: PrismaTeamRepository,
    },
    {
      provide: TeamStaffRepository,
      useClass: PrismaTeamStaffRepository,
    },
    TeamsService,
    TeamStaffService,
  ],
  exports: [TeamRepository, TeamStaffRepository],
})
export class TeamsModule {}
