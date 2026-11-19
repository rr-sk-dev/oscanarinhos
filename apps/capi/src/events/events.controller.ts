import {
  Body,
  Controller,
  createParamDecorator,
  ExecutionContext,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { EventsService } from './events.service';
import {
  CreateEventDto,
  EventResponseDto,
  ListEventsQueryDto,
  UpdateEventDto,
  updateEventValidationPipe,
} from './types/event.dto';
import { EventMapper } from './types/event.mapper';

// Raw body run through the strict (forbidNonWhitelisted) pipe only; see updateEventValidationPipe.
const RawBody = createParamDecorator(
  (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest().body,
);

@Controller('teams/:teamId/events')
@UseGuards(JwtAuthGuard, TeamMemberGuard, RolesGuard)
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  async list(
    @Param('teamId') teamId: string,
    @Query() query: ListEventsQueryDto,
  ): Promise<EventResponseDto[]> {
    const events = await this.eventsService.list(teamId, new Date(query.from), new Date(query.to));
    return events.map(EventMapper.toResponse);
  }

  @Get(':eventId')
  async get(
    @Param('teamId') teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.eventsService.get(teamId, eventId));
  }

  @Post()
  @Roles('ADMIN', 'COACH')
  async create(
    @Param('teamId') teamId: string,
    @Body() dto: CreateEventDto,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.eventsService.create(teamId, dto));
  }

  @Patch(':eventId')
  @Roles('ADMIN', 'COACH')
  async update(
    @Param('teamId') teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @RawBody(undefined, updateEventValidationPipe) dto: UpdateEventDto,
  ): Promise<EventResponseDto> {
    return EventMapper.toResponse(await this.eventsService.update(teamId, eventId, dto));
  }
}
