import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { AvailabilityDataModule } from '../availability/availability-data.module';
import { DatabaseModule } from '../database';
import { EventsModule } from '../events/events.module';
import { MembersModule } from '../members/members.module';
import { PrismaAttendanceRepository } from './attendance-prisma.repository';
import { AttendanceController } from './attendance.controller';
import { AttendanceRepository } from './attendance.repository';
import { AttendanceService } from './attendance.service';
import { StatsService } from './stats.service';

@Module({
  imports: [
    DatabaseModule.forFeature('attendance'),
    AvailabilityDataModule,
    EventsModule,
    MembersModule,
  ],
  controllers: [AttendanceController],
  providers: [
    JwtAuthGuard,
    TeamMemberGuard,
    RolesGuard,
    { provide: AttendanceRepository, useClass: PrismaAttendanceRepository },
    AttendanceService,
    StatsService,
  ],
})
export class AttendanceModule {}
