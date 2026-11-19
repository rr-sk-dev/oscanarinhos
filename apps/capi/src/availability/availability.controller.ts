import { Body, Controller, Get, Param, ParseUUIDPipe, Put, UseGuards } from '@nestjs/common';
import { CurrentMembership } from '../auth/decorators/current-membership.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { MembershipEntity } from '../members/types/membership.entity';
import { AvailabilityService } from './availability.service';
import { Clock } from './clock';
import {
  AvailabilityResponseDto,
  AvailabilitySummaryDto,
  RespondDto,
} from './types/availability.dto';
import { AvailabilityMapper } from './types/availability.mapper';

@Controller('teams/:teamId/events/:eventId/availability')
@UseGuards(JwtAuthGuard, TeamMemberGuard, RolesGuard)
export class AvailabilityController {
  constructor(
    private readonly availabilityService: AvailabilityService,
    private readonly clock: Clock,
  ) {}

  @Put()
  async respond(
    @Param('teamId') teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentMembership() membership: MembershipEntity,
    @Body() dto: RespondDto,
  ): Promise<AvailabilityResponseDto> {
    const answer = await this.availabilityService.respond(
      teamId,
      eventId,
      membership,
      dto,
      this.clock.now(),
    );
    return AvailabilityMapper.toResponse(answer);
  }

  @Get()
  async summary(
    @Param('teamId') teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<AvailabilitySummaryDto> {
    return this.availabilityService.summary(teamId, eventId);
  }
}
