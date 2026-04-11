import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { TeamStaff } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StaffService {
  private readonly baseUrl = environment.apiUrl;

  private readonly staffResource = httpResource<TeamStaff[]>(
    () => ({
      url: `${this.baseUrl}/api/team-staff`,
      params: { teamName: environment.team.slug },
    }),
    { defaultValue: [] },
  );

  readonly staff = this.staffResource.value;
  readonly loading = this.staffResource.isLoading;
  readonly error = computed(() => {
    const err = this.staffResource.error();
    return err ? 'Falha ao carregar equipa técnica' : null;
  });

  getStaff(id: string): TeamStaff | undefined {
    return this.staff().find((m) => m.id === id);
  }
}
