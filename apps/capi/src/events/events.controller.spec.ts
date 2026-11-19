import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { EventsController } from './events.controller';

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
