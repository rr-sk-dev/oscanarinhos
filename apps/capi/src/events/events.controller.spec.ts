import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { MembershipEntity } from '../members/types/membership.entity';
import { EventAnswersService } from './event-answers.service';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { SeriesService } from './series.service';

const proto = EventsController.prototype;
const rolesOf = (handler: object) => Reflect.getMetadata(ROLES_KEY, handler);

describe('EventsController metadata', () => {
  it('applies the auth, team and roles guards to the whole controller', () => {
    expect(Reflect.getMetadata('__guards__', EventsController)).toEqual([
      JwtAuthGuard,
      TeamMemberGuard,
      RolesGuard,
    ]);
  });

  it.each(['create', 'update', 'createSeries'] as const)(
    'restricts %s to ADMIN and COACH',
    (method) => {
      expect(rolesOf(proto[method])).toEqual(['ADMIN', 'COACH']);
    },
  );

  it.each(['list', 'get'] as const)('leaves %s open to every member', (method) => {
    expect(rolesOf(proto[method])).toBeUndefined();
  });
});

describe('EventsController update', () => {
  it('passes the acting member as actorUserId', async () => {
    const event = { id: 'event-1' };
    const eventsService = { update: jest.fn().mockResolvedValue(event) };
    const eventAnswers = {
      enrichOne: jest.fn().mockResolvedValue({ ...event, myAnswer: null }),
    };
    const controller = new EventsController(
      eventsService as unknown as EventsService,
      {} as SeriesService,
      eventAnswers as unknown as EventAnswersService,
    );
    const membership = { userId: 'user-9' } as MembershipEntity;
    const dto = { status: 'CANCELED' as const, notifyTeam: true };

    await controller.update('team-1', 'event-1', dto, membership).catch(() => undefined);

    expect(eventsService.update).toHaveBeenCalledWith('team-1', 'event-1', dto, 'user-9');
  });
});
