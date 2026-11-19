import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { Clock } from '../availability/clock';
import { AttendanceService } from './attendance.service';
import { resolveStatsRange, StatsService } from './stats.service';
import { MarkAttendanceDto } from './types/attendance.dto';
import { StatsQueryDto, TeamStatsDto } from './types/stats.dto';

@Controller('teams/:teamId')
@UseGuards(JwtAuthGuard, TeamMemberGuard, RolesGuard)
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly statsService: StatsService,
    private readonly clock: Clock,
  ) {}

  @Put('events/:eventId/attendance')
  @Roles('ADMIN', 'COACH')
  @HttpCode(204)
  async mark(
    @Param('teamId') teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @Body() dto: MarkAttendanceDto,
  ): Promise<void> {
    await this.attendanceService.mark(teamId, eventId, dto.entries, this.clock.now());
  }

  @Get('stats')
  async stats(
    @Param('teamId') teamId: string,
    @Query() query: StatsQueryDto,
  ): Promise<TeamStatsDto> {
    const { from, to } = resolveStatsRange(
      query.from ? new Date(query.from) : undefined,
      query.to ? new Date(query.to) : undefined,
    );
    return this.statsService.get(teamId, from, to);
  }
}
