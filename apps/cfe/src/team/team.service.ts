import { computed, Service } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { TeamDetails } from '@canarinhos/shared-types';
import { environment } from '../environments/environment';
import { reloadOnResume } from '../shared/data-refresh';
import { valueOr } from '../shared/resource-value';

@Service()
export class TeamService {
  private readonly baseUrl = environment.apiUrl;

  private readonly teamResource = httpResource<TeamDetails>(
    () => `${this.baseUrl}/api/teams/${environment.team.slug}/details`,
  );

  private readonly details = valueOr(this.teamResource, undefined);
  readonly id = computed(() => this.details()?.id ?? null);
  readonly logo = computed(() => this.details()?.logo ?? null);

  constructor() {
    reloadOnResume(this.teamResource);
  }

  reload(): void {
    this.teamResource.reload();
  }
}
