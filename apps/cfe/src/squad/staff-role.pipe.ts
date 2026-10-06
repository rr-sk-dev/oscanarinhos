import { Pipe, PipeTransform } from '@angular/core';
import { staffRoleLabel } from './staff-role-labels';

/** Portuguese label for a staff role, e.g. "COACH" → "Treinador". */
@Pipe({
  name: 'staffRole',
})
export class StaffRolePipe implements PipeTransform {
  transform(role: string): string {
    return staffRoleLabel(role);
  }
}
