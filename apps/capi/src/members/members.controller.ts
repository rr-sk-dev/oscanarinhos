import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentMembership } from '../auth/decorators/current-membership.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { AuthenticatedUser } from '../auth/types/authenticated-user';
import { MembersService } from './members.service';
import { InviteMapper } from './types/invite.mapper';
import { CreateInviteDto, InviteResponseDto, MemberResponseDto } from './types/membership.dto';
import { MembershipEntity } from './types/membership.entity';
import { MembershipMapper } from './types/membership.mapper';

@Controller()
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get('teams/:teamId/members')
  @UseGuards(JwtAuthGuard, TeamMemberGuard, RolesGuard)
  async list(@Param('teamId') teamId: string): Promise<MemberResponseDto[]> {
    const members = await this.membersService.listMembers(teamId);
    return members.map(MembershipMapper.toResponse);
  }

  @Post('teams/:teamId/invites')
  @UseGuards(JwtAuthGuard, TeamMemberGuard, RolesGuard)
  @Roles('ADMIN')
  async createInvite(
    @Param('teamId') teamId: string,
    @CurrentMembership() creator: MembershipEntity,
    @Body() dto: CreateInviteDto,
  ): Promise<InviteResponseDto> {
    const invite = await this.membersService.createInvite(teamId, creator, dto);
    return InviteMapper.toResponse(invite);
  }

  @Post('invites/:code/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async acceptInvite(
    @Param('code') code: string,
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<MemberResponseDto> {
    const membership = await this.membersService.acceptInvite(user.userId, code);
    return MembershipMapper.toResponse(membership);
  }

  @Delete('teams/:teamId/members/:membershipId')
  @UseGuards(JwtAuthGuard, TeamMemberGuard, RolesGuard)
  @Roles('ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('teamId') teamId: string,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
  ): Promise<void> {
    return this.membersService.remove(teamId, membershipId);
  }
}
