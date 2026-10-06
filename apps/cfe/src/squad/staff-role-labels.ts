import { StaffRole } from '@canarinhos/shared-types';

/** Portuguese labels for staff roles. Unknown roles fall back to the raw value. */
const STAFF_ROLE_LABELS: Record<string, string> = {
  [StaffRole.COACH]: 'Treinador',
  [StaffRole.ASSISTANT_COACH]: 'Treinador Adjunto',
  [StaffRole.DELEGATE]: 'Delegado',
  [StaffRole.PHYSICAL_PREPARATOR]: 'Preparador Físico',
};

export const STAFF_ROLE_ORDER: string[] = [
  StaffRole.COACH,
  StaffRole.ASSISTANT_COACH,
  StaffRole.PHYSICAL_PREPARATOR,
  StaffRole.DELEGATE,
];

export function staffRoleLabel(role: string): string {
  return STAFF_ROLE_LABELS[role] ?? role;
}
