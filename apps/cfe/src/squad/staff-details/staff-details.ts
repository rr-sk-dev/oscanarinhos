import { DatePipe, NgOptimizedImage } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { ErrorState } from '@canarinhos/ngx-cui';
import { injectPageTitle } from '../../app/app-title.strategy';
import { AgePipe } from '../age.pipe';
import { StaffService } from '../staff.service';
import { StaffRolePipe } from '../staff-role.pipe';

@Component({
  selector: 'app-staff-details',
  imports: [NgOptimizedImage, ErrorState, AgePipe, DatePipe, StaffRolePipe],
  templateUrl: './staff-details.html',
  styleUrl: './staff-details.css',
})
export class StaffDetails {
  /** Route param, bound by withComponentInputBinding. */
  readonly id = input.required<string>();

  private staffService = inject(StaffService);

  protected member = computed(() => this.staffService.getStaff(this.id()));

  protected fullName = computed(() => {
    const member = this.member();
    return member ? `${member.firstName} ${member.lastName}` : '';
  });

  protected loading = this.staffService.loading;

  protected error = computed(() => {
    const loadError = this.staffService.error();
    if (loadError) {
      return loadError;
    }
    return !this.loading() && !this.member() ? 'Membro não encontrado' : null;
  });

  constructor() {
    injectPageTitle(this.fullName);
  }

  protected canRetry = computed(() => !!this.staffService.error());

  protected retry(): void {
    this.staffService.reload();
  }
}
