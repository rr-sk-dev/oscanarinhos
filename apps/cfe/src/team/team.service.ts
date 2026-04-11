import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { TeamDetails } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly baseUrl = environment.apiUrl;

  private readonly teamResource = httpResource<TeamDetails>(
    () => `${this.baseUrl}/api/teams/${environment.team.slug}/details`,
  );

  readonly details = this.teamResource.value;
  readonly loading = this.teamResource.isLoading;
  readonly error = computed(() => {
    const err = this.teamResource.error();
    return err ? 'Falha ao carregar detalhes da equipa' : null;
  });
  readonly logo = computed(() => this.teamResource.value()?.logo ?? null);
  readonly teamPhoto = computed(
    () => this.teamResource.value()?.teamPhoto ?? null,
  );
}
