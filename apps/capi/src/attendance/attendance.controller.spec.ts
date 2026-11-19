import { ROLES_KEY } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TeamMemberGuard } from '../auth/guards/team-member.guard';
import { AttendanceController } from './attendance.controller';

const proto = AttendanceController.prototype;
const rolesOf = (handler: object) => Reflect.getMetadata(ROLES_KEY, handler);

describe('AttendanceController metadata', () => {
  it('applies the auth, team and roles guards to the whole controller', () => {
    expect(Reflect.getMetadata('__guards__', AttendanceController)).toEqual([
      JwtAuthGuard,
      TeamMemberGuard,
      RolesGuard,
    ]);
  });

  it.each(['mark', 'list'] as const)('restricts %s to ADMIN and COACH', (method) => {
    expect(rolesOf(proto[method])).toEqual(['ADMIN', 'COACH']);
  });

  it('leaves stats open to every member', () => {
    expect(rolesOf(proto.stats)).toBeUndefined();
  });
});
