import { StaffRole } from '@canarinhos/shared-types';

/** Portuguese labels for staff roles; adding a role to StaffRole without a label fails to compile. */
const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  [StaffRole.COACH]: 'Treinador',
  [StaffRole.ASSISTANT_COACH]: 'Treinador Adjunto',
  [StaffRole.DELEGATE]: 'Delegado',
  [StaffRole.PHYSICAL_PREPARATOR]: 'Preparador Físico',
};

/** Display order of the staff list. */
export const STAFF_ROLE_ORDER: readonly StaffRole[] = [
  StaffRole.COACH,
  StaffRole.ASSISTANT_COACH,
  StaffRole.PHYSICAL_PREPARATOR,
  StaffRole.DELEGATE,
];

const isStaffRole = (role: string): role is StaffRole => role in STAFF_ROLE_LABELS;

/** The label for a role; a role the app does not know yet (sent by a newer API) shows as-is. */
export function staffRoleLabel(role: string): string {
  return isStaffRole(role) ? STAFF_ROLE_LABELS[role] : role;
}

/** Position of a role in STAFF_ROLE_ORDER; unknown roles go last. */
export function staffRoleRank(role: string): number {
  return isStaffRole(role) ? STAFF_ROLE_ORDER.indexOf(role) : STAFF_ROLE_ORDER.length;
}
