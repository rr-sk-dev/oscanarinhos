import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StaffRole } from '@canarinhos/shared-types';
import { StaffService } from '../staff.service';

const STAFF_ROLE_LABELS: Record<StaffRole, string> = {
  [StaffRole.COACH]: 'Treinador',
  [StaffRole.ASSISTANT_COACH]: 'Treinador Adjunto',
  [StaffRole.DELEGATE]: 'Delegado',
};

@Component({
  selector: 'app-staff-details',
  imports: [],
  templateUrl: './staff-details.html',
  styleUrl: './staff-details.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StaffDetails {
  private staffService = inject(StaffService);
  private route = inject(ActivatedRoute);

  private staffId = this.route.snapshot.params['id'] as string | undefined;

  protected member = computed(() =>
    this.staffId ? this.staffService.getStaff(this.staffId) : undefined,
  );

  protected loading = this.staffService.loading;

  protected error = computed(() => {
    if (!this.staffId) return 'ID do membro não encontrado';
    if (!this.staffService.loading() && !this.member()) {
      return 'Membro não encontrado';
    }
    return this.staffService.error();
  });

  protected getRoleLabel(role: StaffRole): string {
    return STAFF_ROLE_LABELS[role] ?? role;
  }

  protected getFullName(): string {
    const m = this.member();
    return m ? `${m.firstName} ${m.lastName}` : '';
  }

  protected formatDateOfBirth(date: string | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()}`;
  }

  protected calculateAge(date: string | null | undefined): number | null {
    if (!date) return null;
    const dob = new Date(date);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  }
}
