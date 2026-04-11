import { Controller, Get, Query } from '@nestjs/common';
import { TeamStaffService } from './team-staff.service';
import { TeamStaffResponseDto } from './types/team-staff.dto';

@Controller('team-staff')
export class TeamStaffController {
  constructor(private readonly teamStaffService: TeamStaffService) {}

  @Get()
  async find(@Query('teamName') teamName?: string): Promise<TeamStaffResponseDto[]> {
    return this.teamStaffService.findAll({ teamName });
  }
}
