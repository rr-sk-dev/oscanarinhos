import { Module } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { EventsModule } from '../events/events.module';
import { MembersModule } from '../members/members.module';
import { AvailabilityDataModule } from './availability-data.module';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';

@Module({
  imports: [AvailabilityDataModule, EventsModule, MembersModule],
  controllers: [AvailabilityController],
  providers: [JwtAuthGuard, TeamMemberGuard, RolesGuard, AvailabilityService],
})
export class AvailabilityModule {}
