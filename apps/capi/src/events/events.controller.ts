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
import { CurrentMembership } from '../auth/decorators/current-membership.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { MembershipEntity } from '../members/types/membership.entity';
import { EventAnswersService } from './event-answers.service';
import { EventsService } from './events.service';
import { SeriesService } from './series.service';
import {
  CreateEventDto,
  EventAnswersResponseDto,
  ListEventsQueryDto,
  UpdateEventDto,
  updateEventValidationPipe,
} from './types/event.dto';
import { EventMapper } from './types/event.mapper';
import { CreateSeriesDto } from './types/series.dto';

// Raw body run through the strict (forbidNonWhitelisted) pipe only; see updateEventValidationPipe.
const RawBody = createParamDecorator(
  (_: unknown, context: ExecutionContext) => context.switchToHttp().getRequest().body,
);

@Controller('teams/:teamId/events')
@UseGuards(JwtAuthGuard, TeamMemberGuard, RolesGuard)
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly seriesService: SeriesService,
    private readonly eventAnswers: EventAnswersService,
  ) {}

  @Get()
  async list(
    @Param('teamId') teamId: string,
    @Query() query: ListEventsQueryDto,
    @CurrentMembership() membership: MembershipEntity,
  ): Promise<EventAnswersResponseDto[]> {
    const events = await this.eventsService.list(teamId, new Date(query.from), new Date(query.to));
    const enriched = await this.eventAnswers.enrich(teamId, events, membership);
    return enriched.map(EventMapper.toAnswersResponse);
  }

  // Declared before the :eventId routes; `series` is a literal segment, never parsed as an id.
  @Post('series')
  @Roles('ADMIN', 'COACH')
  async createSeries(
    @Param('teamId') teamId: string,
    @Body() dto: CreateSeriesDto,
    @CurrentMembership() membership: MembershipEntity,
  ): Promise<EventAnswersResponseDto[]> {
    const events = await this.seriesService.create(teamId, dto);
    const enriched = await this.eventAnswers.enrich(teamId, events, membership);
    return enriched.map(EventMapper.toAnswersResponse);
  }

  @Get(':eventId')
  async get(
    @Param('teamId') teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @CurrentMembership() membership: MembershipEntity,
  ): Promise<EventAnswersResponseDto> {
    const event = await this.eventsService.get(teamId, eventId);
    return EventMapper.toAnswersResponse(
      await this.eventAnswers.enrichOne(teamId, event, membership),
    );
  }

  @Post()
  @Roles('ADMIN', 'COACH')
  async create(
    @Param('teamId') teamId: string,
    @Body() dto: CreateEventDto,
    @CurrentMembership() membership: MembershipEntity,
  ): Promise<EventAnswersResponseDto> {
    const event = await this.eventsService.create(teamId, dto);
    return EventMapper.toAnswersResponse(
      await this.eventAnswers.enrichOne(teamId, event, membership),
    );
  }

  @Patch(':eventId')
  @Roles('ADMIN', 'COACH')
  async update(
    @Param('teamId') teamId: string,
    @Param('eventId', ParseUUIDPipe) eventId: string,
    @RawBody(undefined, updateEventValidationPipe) dto: UpdateEventDto,
    @CurrentMembership() membership: MembershipEntity,
  ): Promise<EventAnswersResponseDto> {
    const event = await this.eventsService.update(teamId, eventId, dto, membership.userId);
    return EventMapper.toAnswersResponse(
      await this.eventAnswers.enrichOne(teamId, event, membership),
    );
  }
}
