import { StaffRole } from '@canarinhos/shared-types';
import { staffRoleLabel, staffRoleRank } from './staff-role-labels';

describe('staff role labels', () => {
  it('labels known roles and shows unknown ones as sent', () => {
    expect(staffRoleLabel(StaffRole.ASSISTANT_COACH)).toBe('Treinador Adjunto');
    expect(staffRoleLabel('KIT_MANAGER')).toBe('KIT_MANAGER');
  });

  it('ranks the coach first and unknown roles last', () => {
    expect(staffRoleRank(StaffRole.COACH)).toBe(0);
    expect(staffRoleRank(StaffRole.DELEGATE)).toBeGreaterThan(staffRoleRank(StaffRole.COACH));
    expect(staffRoleRank('KIT_MANAGER')).toBeGreaterThan(staffRoleRank(StaffRole.DELEGATE));
  });
});
