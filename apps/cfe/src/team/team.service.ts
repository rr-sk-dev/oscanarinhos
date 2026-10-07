import { computed, Injectable } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { TeamDetails } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { valueOr } from '../shared/resource-value';

@Injectable({
  providedIn: 'root',
})
export class TeamService {
  private readonly baseUrl = environment.apiUrl;

  private readonly teamResource = httpResource<TeamDetails>(
    () => `${this.baseUrl}/api/teams/${environment.team.slug}/details`,
  );

  private readonly details = valueOr(this.teamResource, undefined);
  readonly id = computed(() => this.details()?.id ?? null);
  readonly logo = computed(() => this.details()?.logo ?? null);
}
